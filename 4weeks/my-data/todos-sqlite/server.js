const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ── DB 초기화 ──
const db = new Database(path.join(__dirname, 'todos.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    content TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// content 컬럼이 없으면 추가 (기존 DB 마이그레이션)
try {
  db.exec(`ALTER TABLE todos ADD COLUMN content TEXT DEFAULT ''`);
} catch (e) {
  // 이미 존재하면 무시
}

// 초기 데이터 (비어있을 때만)
const count = db.prepare('SELECT COUNT(*) as cnt FROM todos').get().cnt;
if (count === 0) {
    const insert = db.prepare('INSERT INTO todos (text, done, content) VALUES (?, ?, ?)');
  insert.run('장보기 - 우유, 계란, 빵 사기', 0, '우유 2팩, 계란 30구, 식빵 1봉');
  insert.run('운동하기 - 헬스장 30분 러닝', 0, '러닝머신 속도 8~10, 스트레칭 포함');
  insert.run('책 읽기 - 클린 코드 3장 정리', 1, '함수 관련 챕터, 노션에 요약 정리');
  insert.run('이메일 확인 - 매일 답장', 0, '팀장님 메일 우선, 스팸 정리');
  insert.run('코드 리뷰 - PR #42 리뷰 완료하기', 0, '인증 모듈 리팩토링 PR, 보안 이슈 체크');
}

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

// ── API Routes ──

// GET /api/todos
app.get('/api/todos', (_req, res) => {
  try {
    const rows = db.prepare('SELECT id, text, done, content FROM todos ORDER BY id').all();
    res.json(rows.map(r => ({ ...r, done: !!r.done, content: r.content || '' })));
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
    const result = db.prepare('INSERT INTO todos (text) VALUES (?)').run(text.trim());
    res.status(201).json({ id: result.lastInsertRowid, text: text.trim(), done: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/todos/:id
app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Todo not found' });

    const text = req.body.text !== undefined ? req.body.text : existing.text;
    const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : existing.done;
    db.prepare('UPDATE todos SET text = ?, done = ? WHERE id = ?').run(text, done, id);
    res.json({ id: Number(id), text, done: !!done });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Todo not found' });
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
