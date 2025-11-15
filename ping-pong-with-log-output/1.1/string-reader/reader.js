const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // install with npm i node-fetch

const app = express();
const port = 3000;

// Paths in the shared volume
const logFile = path.join('/shared', 'log.txt');
const fileContent = path.join('/config', 'information.txt')
const envVariable = process.env.MESSAGE || "MESSAGE not set";

// URL of Ping Pong app inside the cluster
// (pingpong is the service name, 2345 is the service port)
const pingpongURL = 'http://ping-pong-svc:80/pings';

app.get('/', async (req, res) => {
  try {
    let latestLog = "No logs yet!";
    let pingPongs = 0;

    // Get latest log entry
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8').trim().split('\n');
      latestLog = logs[logs.length - 1]; // last line
    }

    // Get ping-pong count via HTTP instead of file
    try {
      const response = await fetch(pingpongURL);
      if (response.ok) {
        const data = await response.json();
        pingPongs = data.count || 0;
      } else {
        console.error('Failed to fetch pong count:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching pong count:', err.message);
    }

    const output = `file content: ${fileContent}
    env variable: MESSAGE=${envVariable}
    ${latestLog}.
    Ping / Pongs: ${pingPongs}`;

    res.type('text/plain').send(output);
  } catch (err) {
    console.error('Error reading logs:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Log Output app listening on port ${port}`);
});
