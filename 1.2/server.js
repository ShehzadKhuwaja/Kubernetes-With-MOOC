const express = require('express');
const app = express();

// Use PORT from environment or default to 3000
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
