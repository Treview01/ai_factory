// hello-server
// Node.js 내장 http 모듈만 사용 (외부 의존성 없음)
// 실행: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// ---------- In-memory data store ----------
let users = [
  { id: 1, name: '홍길동' },
  { id: 2, name: '김철수' },
];
let nextUserId = 3;

// 포켓몬 데이터 (공식 아트웍 이미지 URL 포함)
const ARTWORK = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const pokemons = [
  {
    id: 25,
    name: '피카츄',
    nameEn: 'Pikachu',
    types: [{ label: '전기', color: 'electric' }],
    description: '볼에 있는 전기 주머니에서 전기를 모아 강력한 전격을 뿜어낸다.',
    height: '0.4m',
    weight: '6.0kg',
    imageUrl: ARTWORK(25),
    bg: 'from-yellow-100 to-yellow-200',
  },
  {
    id: 1,
    name: '이상해씨',
    nameEn: 'Bulbasaur',
    types: [
      { label: '풀', color: 'grass' },
      { label: '독', color: 'poison' },
    ],
    description: '태어날 때부터 등에 식물의 씨앗이 있어 조금씩 크게 자라난다.',
    height: '0.7m',
    weight: '6.9kg',
    imageUrl: ARTWORK(1),
    bg: 'from-green-100 to-green-200',
  },
  {
    id: 4,
    name: '파이리',
    nameEn: 'Charmander',
    types: [{ label: '불꽃', color: 'fire' }],
    description: '꼬리 끝에서 태어날 때부터 불꽃이 타오른다. 불꽃이 꺼지면 죽어버린다.',
    height: '0.6m',
    weight: '8.5kg',
    imageUrl: ARTWORK(4),
    bg: 'from-orange-100 to-red-200',
  },
  {
    id: 7,
    name: '꼬부기',
    nameEn: 'Squirtle',
    types: [{ label: '물', color: 'water' }],
    description: '등껍질에 몸을 움츠려 몸을 보호한다. 입에서 거품 물을 내뿜는다.',
    height: '0.5m',
    weight: '9.0kg',
    imageUrl: ARTWORK(7),
    bg: 'from-blue-100 to-blue-200',
  },
  {
    id: 151,
    name: '뮤',
    nameEn: 'Mew',
    types: [{ label: '에스퍼', color: 'psychic' }],
    description: '모든 포켓몬의 유전자를 가지고 있다고 전해지는 환상의 포켓몬.',
    height: '0.4m',
    weight: '4.0kg',
    imageUrl: ARTWORK(151),
    bg: 'from-pink-100 to-pink-200',
  },
];

// ---------- Helpers ----------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: true, status: statusCode, message });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      chunks.push(chunk);
      total += chunk.length;
      // 1MB 제한 (남용 방지)
      if (total > 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  // 기본값: /  →  /index.html
  let relativePath = pathname === '/' ? '/index.html' : pathname;

  // 디렉토리 탈출 방지
  const safePath = path
    .normalize(relativePath)
    .replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    return sendError(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return sendError(res, 404, 'File not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------- API handlers ----------
async function handleApi(req, res, pathname) {
  const method = req.method;

  // GET /api/hello
  if (pathname === '/api/hello' && method === 'GET') {
    return sendJSON(res, 200, {
      message: 'Hello from hello-server!',
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/time
  if (pathname === '/api/time' && method === 'GET') {
    const now = new Date();
    return sendJSON(res, 200, {
      now: now.toISOString(),
      unix: now.getTime(),
    });
  }

  // POST /api/echo
  if (pathname === '/api/echo' && method === 'POST') {
    try {
      const body = await readRequestBody(req);
      return sendJSON(res, 200, body);
    } catch (err) {
      return sendError(res, 400, err.message);
    }
  }

  // GET /api/pokemons
  if (pathname === '/api/pokemons' && method === 'GET') {
    return sendJSON(res, 200, { pokemons });
  }

  // GET /api/pokemons/:id
  const pokemonMatch = pathname.match(/^\/api\/pokemons\/([^/]+)$/);
  if (pokemonMatch && method === 'GET') {
    const id = parseInt(pokemonMatch[1], 10);
    if (Number.isNaN(id)) {
      return sendError(res, 400, '유효하지 않은 id입니다');
    }
    const pokemon = pokemons.find((p) => p.id === id);
    if (!pokemon) return sendError(res, 404, '포켓몬을 찾을 수 없습니다');
    return sendJSON(res, 200, { pokemon });
  }

  // GET /api/users
  if (pathname === '/api/users' && method === 'GET') {
    return sendJSON(res, 200, { users });
  }

  // POST /api/users
  if (pathname === '/api/users' && method === 'POST') {
    try {
      const body = await readRequestBody(req);
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        return sendError(res, 400, 'name은 필수 문자열입니다');
      }
      const user = { id: nextUserId++, name: body.name.trim() };
      users.push(user);
      return sendJSON(res, 201, { user, message: '생성되었습니다' });
    } catch (err) {
      return sendError(res, 400, err.message);
    }
  }

  // /api/users/:id
  const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch) {
    const id = parseInt(userMatch[1], 10);
    if (Number.isNaN(id)) {
      return sendError(res, 400, '유효하지 않은 id입니다');
    }
    const index = users.findIndex((u) => u.id === id);

    // GET /api/users/:id
    if (method === 'GET') {
      if (index === -1) return sendError(res, 404, '사용자를 찾을 수 없습니다');
      return sendJSON(res, 200, { user: users[index] });
    }

    // PUT /api/users/:id
    if (method === 'PUT') {
      if (index === -1) return sendError(res, 404, '사용자를 찾을 수 없습니다');
      try {
        const body = await readRequestBody(req);
        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
          return sendError(res, 400, 'name은 필수 문자열입니다');
        }
        users[index] = { ...users[index], name: body.name.trim() };
        return sendJSON(res, 200, {
          user: users[index],
          message: '수정되었습니다',
        });
      } catch (err) {
        return sendError(res, 400, err.message);
      }
    }

    // DELETE /api/users/:id
    if (method === 'DELETE') {
      if (index === -1) return sendError(res, 404, '사용자를 찾을 수 없습니다');
      const [removed] = users.splice(index, 1);
      return sendJSON(res, 200, {
        user: removed,
        message: '삭제되었습니다',
      });
    }

    return sendError(res, 405, 'Method Not Allowed');
  }

  // 매칭되는 API 없음
  return sendError(res, 404, 'API endpoint not found');
}

// ---------- Main request handler ----------
const server = http.createServer(async (req, res) => {
  try {
    const parsed = url.parse(req.url);
    const pathname = decodeURIComponent(parsed.pathname || '/');

    // CORS 허용 (같은 오리진이면 필요 없지만, 혹시 모를 상황 대비)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // API 라우팅
    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, pathname);
    }

    // 정적 파일 서빙
    if (req.method === 'GET') {
      return serveStatic(req, res, pathname);
    }

    return sendError(res, 405, 'Method Not Allowed');
  } catch (err) {
    console.error('[server error]', err);
    if (!res.headersSent) {
      sendError(res, 500, 'Internal Server Error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`hello-server 실행 중: http://localhost:${PORT}`);
  console.log('종료: Ctrl+C');
});
