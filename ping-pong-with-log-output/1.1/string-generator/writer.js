const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const randomString = uuidv4();
const filePath = '/shared/log.txt'; // Shared volume

console.log("Writer started. Writing every 5 seconds...");

setInterval(() => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(filePath, `${timestamp}: ${randomString}\n`);
}, 5000);