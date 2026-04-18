const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

// ── Middleware ──
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.static(__dirname));

// ── Helpers: todos.json 읽기/쓰기 ──

function readTodos() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// ── API Routes ──

// GET /api/todos
app.get('/api/todos', (_req, res) => {
  try {
    res.json(readTodos());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/todos
app.post('/api/todos', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    const todos = readTodos();
    const id = `todo_${Date.now()}`;
    const todo = { id, text: text.trim(), done: false, content: (req.body.content || '').trim() };
    todos.push(todo);
    writeTodos(todos);
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/todos/:id
app.put('/api/todos/:id', (req, res) => {
  try {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    if (req.body.text !== undefined) todos[idx].text = req.body.text;
    if (req.body.done !== undefined) todos[idx].done = req.body.done;
    if (req.body.content !== undefined) todos[idx].content = req.body.content;
    writeTodos(todos);
    res.json(todos[idx]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', (req, res) => {
  try {
    let todos = readTodos();
    const idx = todos.findIndex(t => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    todos.splice(idx, 1);
    writeTodos(todos);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ──
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
