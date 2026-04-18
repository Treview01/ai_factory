const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================
// In-Memory Data Store
// ============================================
const pokemons = [
  {
    id: 25,
    name: '피카츄',
    nameEn: 'Pikachu',
    types: ['전기'],
    description: '볼에 있는 전기 주머니에서 전기를 모아 강력한 전격을 뿜어낸다.',
    height: '0.4m',
    weight: '6.0kg',
    stats: { hp: 35, attack: 55, defense: 40, speed: 90 },
  },
  {
    id: 1,
    name: '이상해씨',
    nameEn: 'Bulbasaur',
    types: ['풀', '독'],
    description: '태어날 때부터 등에 식물의 씨앗이 있어 조금씩 크게 자라난다.',
    height: '0.7m',
    weight: '6.9kg',
    stats: { hp: 45, attack: 49, defense: 49, speed: 45 },
  },
  {
    id: 4,
    name: '파이리',
    nameEn: 'Charmander',
    types: ['불꽃'],
    description: '꼬리 끝에서 태어날 때부터 불꽃이 타오른다. 불꽃이 꺼지면 죽어버린다.',
    height: '0.6m',
    weight: '8.5kg',
    stats: { hp: 39, attack: 52, defense: 43, speed: 65 },
  },
  {
    id: 7,
    name: '꼬부기',
    nameEn: 'Squirtle',
    types: ['물'],
    description: '등껍질에 몸을 움츠려 몸을 보호한다. 입에서 거품 물을 내뿜는다.',
    height: '0.5m',
    weight: '9.0kg',
    stats: { hp: 44, attack: 48, defense: 65, speed: 43 },
  },
  {
    id: 151,
    name: '뮤',
    nameEn: 'Mew',
    types: ['에스퍼'],
    description: '모든 포켓몬의 유전자를 가지고 있다고 전해지는 환상의 포켓몬.',
    height: '0.4m',
    weight: '4.0kg',
    stats: { hp: 100, attack: 100, defense: 100, speed: 100 },
  },
];

// ============================================
// API Routes
// ============================================

// GET /api/pokemons — 전체 목록 (검색/타입 필터 지원)
app.get('/api/pokemons', (req, res) => {
  try {
    const { q, type } = req.query;
    let result = [...pokemons];

    if (q) {
      const query = String(q).toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.nameEn.toLowerCase().includes(query) ||
          String(p.id).includes(query)
      );
    }

    if (type) {
      result = result.filter((p) => p.types.includes(String(type)));
    }

    res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/pokemons/:id — 단일 포켓몬
app.get('/api/pokemons/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const pokemon = pokemons.find((p) => p.id === id);
    if (!pokemon) {
      return res.status(404).json({ success: false, message: 'Pokemon not found' });
    }
    res.json({ success: true, data: pokemon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/types — 등록된 전체 타입 목록
app.get('/api/types', (_req, res) => {
  const types = [...new Set(pokemons.flatMap((p) => p.types))];
  res.json({ success: true, data: types });
});

// ============================================
// SPA Fallback (Express 5 문법)
// ============================================
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// Error Handler
// ============================================
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// Startup (Local + Vercel Dual-Mode)
// ============================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
