const { v4: uuidv4 } = require('uuid');

// Generate a random UUID on startup
const randomString = uuidv4();

console.log("Application started. Logging every 5 seconds...");

// Function to log the string with a timestamp every 5 seconds
setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${randomString}`);
}, 5000);
