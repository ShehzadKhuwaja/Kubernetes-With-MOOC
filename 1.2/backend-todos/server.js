// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();

// ----- Config / Env -----
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';
const MAX_TODO_LENGTH = Number(process.env.MAX_TODO_LENGTH) || 140;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST, // service name in K8s
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Readiness endpoint
app.get("/ready", async (req, res) => {
  try {
    // Lightweight DB check
    await pool.query("SELECT 1");
    res.status(200).send("READY");
  } catch (err) {
    console.error("❌ Readiness check failed: DB not reachable");
    res.status(500).send("NOT READY");
  }
});

// ----- Helpers -----
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
};

const trimPreview = (s = '', n = 50) => (s.length > n ? s.substring(0, n) + '...' : s);

// ----- Request & Response logging middleware -----
// This approach listens to 'finish' so it works with res.json, res.send, streaming, etc.
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = getClientIp(req);

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Incoming request',
    method,
    url,
    userAgent,
    ip
  }));

  res.on('finish', () => {
    const duration = Date.now() - start;
    const contentLength = res.getHeader('Content-Length') || '-';
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Response completed',
      method,
      url,
      statusCode: res.statusCode,
      durationMs: duration,
      contentLength
    }));
  });

  next();
};

// ----- Validation helpers & middleware -----
function validateTodoLengthText(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, code: 400, error: 'Todo text is required' };
  }
  if (text.length > MAX_TODO_LENGTH) {
    return { ok: false, code: 400, error: `Todo exceeds maximum length of ${MAX_TODO_LENGTH} characters`, submittedLength: text.length, maxAllowed: MAX_TODO_LENGTH };
  }
  return { ok: true };
}

// middleware used for routes that accept a body to create/update text
const validateTodo = (req, res, next) => {
  // Only validate where a body text is supplied (POST or PUT)
  if (req.method === 'POST' || req.method === 'PUT') {
    const { text } = req.body;
    const validation = validateTodoLengthText(text);
    if (!validation.ok) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: 'Todo validation failed',
        method: req.method,
        url: req.originalUrl,
        ip: getClientIp(req),
        reason: validation.error,
        ...(validation.submittedLength ? { submittedLength: validation.submittedLength } : {})
      }));
      return res.status(validation.code).json({ error: validation.error, ...(validation.submittedLength ? { submittedLength: validation.submittedLength } : {}) });
    }

    // small debug log for success
    if (req.method === 'POST') {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Todo validation passed',
        method: req.method,
        url: req.originalUrl,
        todoLength: text.length,
        preview: trimPreview(text, 30)
      }));
    }
  }

  next();
};

// ----- Global Middlewares -----
app.enable('trust proxy'); // useful if running behind a proxy/load balancer
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

// ----- Routes -----
// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    maxTodoLength: MAX_TODO_LENGTH
  });
});

app.get("/", (req, res) => {
  res.status(200).send("Backend OK");
});

// GET all todos
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Todos retrieved',
      method: req.method,
      url: req.originalUrl,
      count: result.rows.length
    }));
    res.json(result.rows);
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Database error fetching todos',
      method: req.method,
      url: req.originalUrl,
      error: err.message
    }));
    res.status(500).json({ error: 'Database error' });
  }
});

// POST create todo (validateTodo applied)
app.post('/api/todos', validateTodo, async (req, res) => {
  const { text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO todos (text, done) VALUES ($1, $2) RETURNING *',
      [text, false]
    );
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Todo created successfully',
      method: req.method,
      url: req.originalUrl,
      todoId: result.rows[0].id,
      preview: trimPreview(text, 30)
    }));
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Database error creating todo',
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      preview: trimPreview(text, 30)
    }));
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update todo (validateTodo applied to ensure text length if provided)
app.put('/api/todos/:id', validateTodo, async (req, res) => {
  const { id } = req.params;
  const { text, done } = req.body;

  try {
    let result;
    if (text !== undefined && done !== undefined) {
      result = await pool.query('UPDATE todos SET text = $1, done = $2 WHERE id = $3 RETURNING *', [text, done, id]);
    } else if (text !== undefined) {
      result = await pool.query('UPDATE todos SET text = $1 WHERE id = $2 RETURNING *', [text, id]);
    } else if (done !== undefined) {
      result = await pool.query('UPDATE todos SET done = $1 WHERE id = $2 RETURNING *', [done, id]);
    } else {
      // nothing to update
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    if (!result.rows.length) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: 'Todo not found for update',
        method: req.method,
        url: req.originalUrl,
        todoId: id
      }));
      return res.status(404).json({ error: 'Todo not found' });
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Todo updated successfully',
      method: req.method,
      url: req.originalUrl,
      todoId: id
    }));
    res.json(result.rows[0]);
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Database error updating todo',
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      todoId: id
    }));
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: 'Todo not found for deletion',
        method: req.method,
        url: req.originalUrl,
        todoId: id
      }));
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Todo deleted successfully',
      method: req.method,
      url: req.originalUrl,
      todoId: id
    }));
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Database error deleting todo',
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      todoId: id
    }));
    res.status(500).json({ error: 'Database error' });
  }
});

// ----- Error handler (last middleware) -----
app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: 'Unhandled error',
    error: err?.message || err
  }));
  res.status(500).json({ error: 'Internal server error' });
});

// ----- Start server -----
// Do not log credentials — only non-sensitive info
app.listen(PORT, () => {
  console.log(`✅ todo-backend running on port ${PORT}`);
  console.log(`CORS allowed origin: ${ALLOWED_ORIGIN}`);
  console.log(`Max todo length: ${MAX_TODO_LENGTH} characters`);
  console.log('Request logging and validation middleware enabled');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server and DB pool');
  pool.end().then(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('SIGINT received: closing HTTP server and DB pool');
  pool.end().then(() => process.exit(0));
});
