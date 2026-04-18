require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ── pg로 DB 연결 ──
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

// ── 테이블 초기화 ──
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      pinned BOOLEAN DEFAULT false,
      color TEXT DEFAULT '#ffffff',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM memos');
  if (parseInt(rows[0].cnt) === 0) {
    await pool.query(`
      INSERT INTO memos (title, content, pinned, color) VALUES
        ('회의 메모', '월요일 오전 10시 팀 미팅\n- 스프린트 리뷰\n- 다음 주 계획 논의\n- 배포 일정 확인', true, '#fff3cd'),
        ('장보기 목록', '우유 2팩\n계란 30구\n식빵\n바나나\n닭가슴살', false, '#d1ecf1'),
        ('읽을 책 리스트', '1. 클린 코드 - 로버트 마틴\n2. 리팩터링 - 마틴 파울러\n3. 디자인 패턴 - GoF', false, '#d4edda'),
        ('프로젝트 아이디어', '메모장 앱 PostgreSQL 연동\n- CRUD API\n- 색상 지정\n- 핀 고정 기능\n- 검색 기능', false, '#e2d9f3'),
        ('운동 루틴', '월: 가슴 + 삼두\n화: 등 + 이두\n수: 하체\n목: 어깨\n금: 유산소 30분', false, '#fde2e2')
    `);
    console.log('초기 메모 5개 삽입 완료');
  }
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

// GET /api/memos — 전체 조회 (핀 고정 우선, 최신순 + 검색)
app.get('/api/memos', async (req, res) => {
  try {
    const search = req.query.q || '';
    let query, params;
    if (search) {
      query = `SELECT * FROM memos WHERE title ILIKE $1 OR content ILIKE $1 ORDER BY pinned DESC, updated_at DESC`;
      params = [`%${search}%`];
    } else {
      query = `SELECT * FROM memos ORDER BY pinned DESC, updated_at DESC`;
      params = [];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/memos/:id — 단일 조회
app.get('/api/memos/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM memos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Memo not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/memos — 생성
app.post('/api/memos', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO memos (title, content, color) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), (content || '').trim(), color || '#ffffff']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/memos/:id — 수정
app.put('/api/memos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM memos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    const old = existing.rows[0];
    const title = req.body.title !== undefined ? req.body.title : old.title;
    const content = req.body.content !== undefined ? req.body.content : old.content;
    const pinned = req.body.pinned !== undefined ? req.body.pinned : old.pinned;
    const color = req.body.color !== undefined ? req.body.color : old.color;
    const done = req.body.done !== undefined ? req.body.done : old.done;

    const { rows } = await pool.query(
      'UPDATE memos SET title = $1, content = $2, pinned = $3, color = $4, done = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [title, content, pinned, color, done, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/memos/:id — 삭제
app.delete('/api/memos/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM memos WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Memo not found' });
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
    .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
    .catch(err => { console.error('DB 초기화 실패:', err.message); process.exit(1); });
}
module.exports = app;
