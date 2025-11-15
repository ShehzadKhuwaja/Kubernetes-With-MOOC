const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST, // service name in K8s
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Pingpong endpoint
app.get("/pingpong", async (req, res) => {
  try {
    await pool.query("UPDATE counter SET value = value + 1 WHERE id = 1");
    const result = await pool.query("SELECT value FROM counter WHERE id = 1");
    res.send(`pong ${result.rows[0].value}`);
  } catch (err) {
    console.error("❌ Error handling /pingpong:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Pings endpoint (returns JSON count)
app.get("/pings", async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM counter WHERE id = 1");
    res.json({ count: result.rows[0].value });
  } catch (err) {
    console.error("❌ Error handling /pings:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Ping-pong app listening at http://localhost:${port}`);
});
