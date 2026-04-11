// ========================================
// Mental Chat Server
// - Serves index.html at /
// - Proxies chat requests to OpenAI via POST /api/chat
// ========================================

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// OpenAI API key: loaded from .env (see .env.example)
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
  console.error('   .env.example을 복사해 .env 파일을 만들고 키를 입력하세요:');
  console.error('   cp .env.example .env');
  process.exit(1);
}

const SYSTEM_PROMPT =
  "당신은 '마음 상담사 T리뷰'입니다. 따뜻하고 공감적인 톤으로 한국어로 답변하세요. 사용자의 감정을 먼저 인정하고, 짧고 부드러운 문장으로 응답하세요. 의료 진단은 하지 않습니다.";

// ---------- Middleware ----------
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

// ---------- Routes ----------

// Root → index.html (express.static already handles this, but explicit is safer)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// OpenAI chat proxy
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: 'messages 배열이 필요합니다.' });
    }

    // Filter/normalize: only keep valid user/assistant turns with string content
    const safeMessages = messages
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0
      )
      .map((m) => ({ role: m.role, content: m.content }));

    const payload = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages],
      temperature: 0.8,
      max_tokens: 500,
    };

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[OpenAI error]', upstream.status, errText);
      return res
        .status(500)
        .json({ error: `OpenAI API 오류 (${upstream.status})` });
    }

    const data = await upstream.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      '지금은 답변을 드리기 어려워요. 잠시 후 다시 말씀해 주실래요?';

    return res.json({ reply });
  } catch (err) {
    console.error('[/api/chat] error:', err);
    return res
      .status(500)
      .json({ error: '서버에서 문제가 발생했어요. 잠시 후 다시 시도해 주세요.' });
  }
});

// ---------- Error handler ----------
app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: '알 수 없는 서버 오류' });
});

// ---------- Startup ----------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌸 Mental Chat server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
