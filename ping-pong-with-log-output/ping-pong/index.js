const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Path to the counter file in the mounted persistent volume
const counterFile = path.join('/data', 'count.txt');

// Ensure file exists
if (!fs.existsSync(counterFile)) {
  fs.writeFileSync(counterFile, '0', 'utf8');
}

app.get('/pingpong', (req, res) => {
  try {
    // Read counter from file
    let counter = parseInt(fs.readFileSync(counterFile, 'utf8'), 10);

    res.send(`pong ${counter}`);

    // Increment and save counter
    counter++;
    fs.writeFileSync(counterFile, counter.toString(), 'utf8');
  } catch (err) {
    console.error('Error reading/writing counter file:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Ping-pong app listening at http://localhost:${port}`);
});
