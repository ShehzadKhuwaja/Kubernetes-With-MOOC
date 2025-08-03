const express = require('express');
const app = express();
const port = 3000;

let counter = 0;

app.get('/pingpong', (req, res) => {
  res.send(`pong ${counter}`);
  counter++;
});

app.listen(port, () => {
  console.log(`Ping-pong app listening at http://localhost:${port}`);
});
