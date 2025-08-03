const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const filePath = '/shared/log.txt';

app.get('/', (req, res) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(`<pre>${content}</pre>`);
  } else {
    res.send("No logs yet!");
  }
});

app.listen(port, () => {
  console.log(`Reader listening on port ${port}`);
});
