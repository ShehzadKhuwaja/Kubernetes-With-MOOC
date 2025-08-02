const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Generate a random UUID on startup
const randomString = uuidv4();

console.log("Application started. Logging every 5 seconds...");

// Function to log the string with a timestamp every 5 seconds
setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${randomString}`);
}, 5000);

// Route to display timestamp and UUID
app.get('/', (req, res) => {
  const timestamp = new Date().toISOString();
  res.send(`
    <h1>UUID Logger</h1>
    <p><strong>Timestamp:</strong> ${timestamp}</p>
    <p><strong>UUID:</strong> ${randomString}</p>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
