const express = require('express');
const app = express();

// Use PORT from environment or default to 3000
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hello</title>
      </head>
      <body>
        <h1>Hello World</h1>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
