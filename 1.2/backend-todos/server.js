const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let todos = [];

// GET /todos → fetch all todos
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

// POST /todos → create a new todo
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
});
