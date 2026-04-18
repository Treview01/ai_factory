const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ── DB 연결 ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.hjazhydqvboccxwhjkuj:twncj115200@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

// ── 테이블 초기화 ──
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      content TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM todos');
  if (parseInt(rows[0].cnt) === 0) {
    await pool.query(`
      INSERT INTO todos (text, done, content) VALUES
        ('장보기 - 우유, 계란, 빵 사기', false, '우유 2팩, 계란 30구, 식빵 1봉'),
        ('운동하기 - 헬스장 30분 러닝', false, '러닝머신 속도 8~10, 스트레칭 포함'),
        ('책 읽기 - 클린 코드 3장 정리', true, '함수 관련 챕터, 노션에 요약 정리'),
        ('이메일 확인 - 매일 답장', false, '팀장님 메일 우선, 스팸 정리'),
        ('코드 리뷰 - PR #42 리뷰 완료하기', false, '인증 모듈 리팩토링 PR, 보안 이슈 체크')
    `);
    console.log('초기 데이터 5개 삽입 완료');
  }
}

// ── Vercel 서버리스: 첫 요청 시 DB 초기화 ──
let dbReady = false;
async function ensureDB(req, res, next) {
  if (!dbReady) {
    await initDB();
    dbReady = true;
  }
  next();
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
app.use(ensureDB);
app.use(express.static(__dirname));

// ── API Routes ──

// GET /api/todos
app.get('/api/todos', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, text, done, content FROM todos ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/todos
app.post('/api/todos', async (req, res) => {
  try {
    const { text, content } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO todos (text, content) VALUES ($1, $2) RETURNING id, text, done, content',
      [text.trim(), (content || '').trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/todos/:id
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const old = existing.rows[0];
    const text = req.body.text !== undefined ? req.body.text : old.text;
    const done = req.body.done !== undefined ? req.body.done : old.done;
    const content = req.body.content !== undefined ? req.body.content : old.content;

    const { rows } = await pool.query(
      'UPDATE todos SET text = $1, done = $2, content = $3 WHERE id = $4 RETURNING id, text, done, content',
      [text, done, content, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
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
  initDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch(err => {
      console.error('DB 초기화 실패:', err.message);
      process.exit(1);
    });
}
module.exports = app;
