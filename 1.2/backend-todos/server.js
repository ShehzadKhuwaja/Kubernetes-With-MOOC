const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Read from environment variables (with fallbacks)
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGIN
}));
app.use(express.json());

// In-memory storage
let todos = [];

// GET /api/todos → fetch all todos
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

// POST /api/todos → create a new todo
app.post("/api/todos", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Todo text is required" });
  }

  const newTodo = {
    id: todos.length + 1,
    text,
    done: false
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ todo-backend running on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${ALLOWED_ORIGIN}`);
});
