const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_DIR = __dirname;

// ── Middleware ──
app.use(express.json());
app.use(express.static(TODOS_DIR));

// ── Helpers: .txt 파일 ↔ todo 변환 ──

function getTxtFiles() {
  return fs.readdirSync(TODOS_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();
}

function fileToTodo(filename) {
  const filepath = path.join(TODOS_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf-8').trim();
  const id = path.basename(filename, '.txt');
  // 첫 줄: text, 두번째 줄: done 상태, 세번째 줄~: content
  const lines = raw.split('\n');
  const text = lines[0] || id;
  const done = lines[1] === 'done';
  const content = lines.slice(2).join('\n') || '';
  return { id, text, done, content };
}

function saveTodo(todo) {
  const filepath = path.join(TODOS_DIR, `${todo.id}.txt`);
  const data = `${todo.text}\n${todo.done ? 'done' : 'active'}\n${todo.content || ''}`;
  fs.writeFileSync(filepath, data, 'utf-8');
}

// ── API Routes ──

// GET /api/todos — 전체 조회
app.get('/api/todos', (_req, res) => {
  try {
    const todos = getTxtFiles().map(fileToTodo);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/todos — 생성
app.post('/api/todos', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    // 파일명: 텍스트에서 앞부분 추출 (특수문자 제거)
    const id = text.trim().split(/[\s\-—]+/)[0].replace(/[\/\\:*?"<>|]/g, '') || `todo_${Date.now()}`;
    // 중복 파일명 처리
    let finalId = id;
    let counter = 1;
    while (fs.existsSync(path.join(TODOS_DIR, `${finalId}.txt`))) {
      finalId = `${id}_${counter++}`;
    }
    const todo = { id: finalId, text: text.trim(), done: false, content: (req.body.content || '').trim() };
    saveTodo(todo);
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/todos/:id — 수정
app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(TODOS_DIR, `${id}.txt`);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const existing = fileToTodo(`${id}.txt`);
    const updated = {
      id,
      text: req.body.text !== undefined ? req.body.text : existing.text,
      done: req.body.done !== undefined ? req.body.done : existing.done,
      content: req.body.content !== undefined ? req.body.content : existing.content,
    };
    saveTodo(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/todos/:id — 삭제
app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(TODOS_DIR, `${id}.txt`);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(TODOS_DIR, 'index.html'));
});

// ── Start ──
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
