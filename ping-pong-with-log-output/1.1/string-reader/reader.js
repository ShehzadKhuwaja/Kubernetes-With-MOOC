const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Paths in the shared volume
const logFile = path.join('/shared', 'log.txt');
const counterFile = path.join('/ping-pong-data', 'count.txt');

app.get('/', (req, res) => {
  try {
    let latestLog = "No logs yet!";
    let pingPongs = 0;

    // Get latest log entry
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8').trim().split('\n');
      latestLog = logs[logs.length - 1]; // last line
    }

    // Get ping-pong count
    if (fs.existsSync(counterFile)) {
      pingPongs = parseInt(fs.readFileSync(counterFile, 'utf8'), 10) || 0;
    }

    const output = `${latestLog}.\nPing / Pongs: ${pingPongs}`;
    res.type('text/plain').send(output);
  } catch (err) {
    console.error('Error reading shared files:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Reader listening on port ${port}`);
});
