const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 5000;
const dataFilePath = path.join(__dirname, "data", "sessions.json");
let sessionWriteQueue = Promise.resolve();
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
]);

function isLoopbackAddress(ipAddress) {
  return ["::1", "::ffff:127.0.0.1", "127.0.0.1"].includes(ipAddress);
}

// CORS (Cross-Origin Resource Sharing) allows a web page from one origin
// to request resources from another origin. In this project, that means the
// frontend can call the backend API from expected local development origins.
app.use((req, res, next) => {
  const requestOrigin = req.get("origin");

  if (!requestOrigin && !isLoopbackAddress(req.ip)) {
    res.status(403).json({
      error: "Requests without an Origin header are only allowed from the local machine."
    });
    return;
  }

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("This origin is not allowed to access the local study tracker API."));
    }
  })
);

// express.json() reads incoming JSON request bodies and turns them into
// JavaScript objects on req.body. Without this middleware, POST payloads
// would arrive as raw text and be harder to validate safely.
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

async function readSessions() {
  // Promise-based fs operations are asynchronous, so Node.js can continue
  // handling other requests while waiting for the operating system to finish
  // reading from disk.
  const fileContents = await fs.readFile(dataFilePath, "utf8");
  const parsedSessions = JSON.parse(fileContents);

  if (!Array.isArray(parsedSessions)) {
    throw new Error("Session data file must contain a JSON array.");
  }

  return parsedSessions;
}

async function writeSessions(sessions) {
  await fs.writeFile(dataFilePath, JSON.stringify(sessions, null, 2), "utf8");
}

function generateSessionId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function queueSessionWrite(mutateSessions) {
  // Concurrent POST requests can otherwise race: two handlers may read the same
  // file contents, append independently, and let the later write overwrite the
  // earlier one. Chaining writes through one promise queue serializes the
  // read-modify-write cycle so every completed session is preserved.
  const nextWrite = sessionWriteQueue.then(async () => {
    const sessions = await readSessions();
    const result = await mutateSessions(sessions);
    await writeSessions(sessions);
    return result;
  });

  sessionWriteQueue = nextWrite.catch(() => {});
  return nextWrite;
}

function queueSessionRead(readOperation) {
  // Readers wait for any in-flight queued write to finish so they never parse
  // the file while a write is still replacing its contents on disk.
  return sessionWriteQueue.then(() => readOperation());
}

function validateSessionPayload(subject, durationMinutes) {
  if (typeof subject !== "string" || subject.trim().length === 0) {
    return "The 'subject' field must be a non-empty string.";
  }

  if (
    typeof durationMinutes !== "number" ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    !Number.isInteger(durationMinutes)
  ) {
    return "The 'durationMinutes' field must be a positive integer.";
  }

  return null;
}

app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await queueSessionRead(readSessions);
    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Failed to read study sessions:", error);
    return res.status(500).json({
      error: "Unable to read study sessions from local storage."
    });
  }
});

app.post("/api/session", async (req, res) => {
  try {
    const { subject, durationMinutes } = req.body;
    const validationError = validateSessionPayload(subject, durationMinutes);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const newSession = await queueSessionWrite(async (existingSessions) => {
      // Appending to an array mutates the collection by placing the newest
      // object at the end. We keep the persisted history in insertion order and
      // let the frontend reverse it for display.
      const sessionToStore = {
        id: generateSessionId(),
        subject: subject.trim(),
        durationMinutes,
        completedAt: new Date().toISOString()
      };

      existingSessions.push(sessionToStore);
      return sessionToStore;
    });

    return res.status(201).json(newSession);
  } catch (error) {
    console.error("Failed to save study session:", error);
    return res.status(500).json({
      error: "Unable to save the study session to local storage."
    });
  }
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Student Study Tracker backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to initialize the data file:", error);
    process.exit(1);
  });
