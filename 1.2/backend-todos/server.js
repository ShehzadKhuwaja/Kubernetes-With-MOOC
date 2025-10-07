const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN
const db_name = process.env.PGDATABASE
const db_user = process.env.PGUSER
const db_port = process.env.PGPORT
const db_password = process.env.PGPASSWORD
const db_host = process.env.PGHOST
const DB_URL = `postgres://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}?sslmode=disable`;

// Middleware
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ✅ Postgres connection pool
const pool = new Pool({
  connectionString: DB_URL
});

// ✅ Ensure table exists
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
initDB().catch(err => console.error("DB init error:", err));

// GET /api/todos → fetch all todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/todos → create a new todo
app.post("/api/todos", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Todo text is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO todos (text, done) VALUES ($1, $2) RETURNING *",
      [text, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ todo-backend running on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${ALLOWED_ORIGIN}`);
  console.log(`Postgres DB: ${DB_URL}`);
});
