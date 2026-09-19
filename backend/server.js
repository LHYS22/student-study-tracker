const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE_PATH = path.join(__dirname, 'data', 'sessions.json');
let sessionWriteQueue = Promise.resolve();

// CORS (Cross-Origin Resource Sharing) allows a browser page served from one
// origin to safely request data from a different origin during development.
app.use(cors());

// express.json() parses incoming JSON text into JavaScript objects so route
// handlers can validate and use request data through req.body.
app.use(express.json());

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, '[]', 'utf8');
  }
}

async function readSessionsFromFile() {
  await ensureDataFile();

  // readFile is asynchronous, which means Node.js can keep handling other work
  // instead of blocking the entire process while waiting on disk I/O.
  const fileContents = await fs.readFile(DATA_FILE_PATH, 'utf8');
  const parsedData = JSON.parse(fileContents || '[]');

  if (!Array.isArray(parsedData)) {
    throw new Error('Session data file must contain a JSON array.');
  }

  return parsedData;
}

async function writeSessionsToFile(sessions) {
  // JSON.stringify converts the in-memory array back into text so it can be
  // persisted on disk. The spacing argument formats the file for readability.
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(sessions, null, 2), 'utf8');
}

function enqueueSessionWrite(work) {
  // Serializing writes through a shared promise queue prevents a classic
  // read-modify-write race where concurrent requests could overwrite each other.
  const queuedWork = sessionWriteQueue.then(work);
  sessionWriteQueue = queuedWork.catch(() => {});
  return queuedWork;
}

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await readSessionsFromFile();
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Failed to read sessions:', error);
    res.status(500).json({ error: 'Unable to read study sessions.' });
  }
});

app.post('/api/session', async (req, res) => {
  try {
    const { subject, durationMinutes } = req.body;

    const subjectIsValid = typeof subject === 'string' && subject.trim().length > 0;
    const durationIsValid =
      Number.isInteger(durationMinutes) && durationMinutes > 0 && durationMinutes <= 1440;

    if (!subjectIsValid || !durationIsValid) {
      return res.status(400).json({
        error:
          'Invalid payload. "subject" must be a non-empty string and "durationMinutes" must be a positive integer.'
      });
    }

    const newSession = await enqueueSessionWrite(async () => {
      const sessions = await readSessionsFromFile();
      const sessionToSave = {
        // randomUUID() provides a collision-resistant identifier, which is more
        // reliable than millisecond timestamps when requests arrive close together.
        id: crypto.randomUUID(),
        subject: subject.trim(),
        durationMinutes,
        completedAt: new Date().toISOString()
      };

      // Array push mutates the existing array by appending a new element at the
      // end, which is appropriate here because we want to preserve prior history.
      sessions.push(sessionToSave);
      await writeSessionsToFile(sessions);
      return sessionToSave;
    });

    return res.status(201).json(newSession);
  } catch (error) {
    console.error('Failed to save session:', error);
    return res.status(500).json({ error: 'Unable to save study session.' });
  }
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Student study tracker backend is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data storage:', error);
    process.exit(1);
  });
