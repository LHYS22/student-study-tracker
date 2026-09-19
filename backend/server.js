const path = require('path');
const { createStudyTrackerApp } = require('./app');

const PORT = 5000;
const DATA_FILE_PATH = path.join(__dirname, 'data', 'sessions.json');
const { app, ensureDataFile } = createStudyTrackerApp({ dataFilePath: DATA_FILE_PATH });

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
