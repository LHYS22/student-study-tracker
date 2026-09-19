const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createStudyTrackerApp } = require('./app');

async function startTestServer(seedData = '[]') {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'study-tracker-'));
  const dataFilePath = path.join(tempDirectory, 'sessions.json');
  await fs.writeFile(dataFilePath, seedData, 'utf8');

  const { app, ensureDataFile } = createStudyTrackerApp({ dataFilePath });
  await ensureDataFile();

  const server = await new Promise((resolve) => {
    const runningServer = app.listen(0, () => resolve(runningServer));
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    dataFilePath,
    async cleanup() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  };
}

test('GET /api/sessions returns stored sessions', async () => {
  const harness = await startTestServer(
    JSON.stringify(
      [
        {
          id: 'session-1',
          subject: 'Algorithms',
          durationMinutes: 25,
          completedAt: '2026-09-19T16:00:00.000Z'
        }
      ],
      null,
      2
    )
  );

  try {
    const response = await fetch(`${harness.baseUrl}/api/sessions`);
    const sessions = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(sessions), true);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].subject, 'Algorithms');
  } finally {
    await harness.cleanup();
  }
});

test('POST /api/sessions rejects invalid payloads', async () => {
  const harness = await startTestServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: '',
        durationMinutes: '25'
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /Invalid payload/);
  } finally {
    await harness.cleanup();
  }
});

test('POST /api/sessions stores a new validated session', async () => {
  const harness = await startTestServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Operating Systems',
        durationMinutes: 25
      })
    });

    const createdSession = await response.json();
    const fileContents = await fs.readFile(harness.dataFilePath, 'utf8');
    const storedSessions = JSON.parse(fileContents);

    assert.equal(response.status, 201);
    assert.equal(typeof createdSession.id, 'string');
    assert.equal(createdSession.subject, 'Operating Systems');
    assert.equal(createdSession.durationMinutes, 25);
    assert.equal(storedSessions.length, 1);
    assert.equal(storedSessions[0].subject, 'Operating Systems');
  } finally {
    await harness.cleanup();
  }
});
