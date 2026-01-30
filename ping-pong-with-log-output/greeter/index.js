const express = require("express");


const app = express();


app.get("/greet", async (req, res) => {
  res.json({ message: `greetings: Hello from version 2` });
});

app.listen(3000, () => {
  console.log(`🚀 Ping-pong app listening at http://localhost:3000`);
});