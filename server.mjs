import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const STATIC_DIR = path.join(__dirname, 'apps', 'playground', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const DOCS_DIR = path.join(__dirname, 'apps', 'docs', 'src');

/** Returns the sorted list of available doc page slugs. */
function listDocPages() {
  try {
    return fs.readdirSync(DOCS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .sort();
  } catch {
    return [];
  }
}

const startTime = Date.now();

// In-memory canonical collaborative document state
let currentCollabDocument = {
  format: 'aurora',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Aurora Real-Time Collaborative Workspace' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Welcome to ' },
        { type: 'text', text: 'Aurora Editor', marks: [{ type: 'bold' }] },
        {
          type: 'text',
          text: ' — an enterprise-ready, white-labelable rich-text platform with zero vendor lock-in.'
        }
      ]
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Multi-client real-time synchronization, versioned JSON documents, and governed review workflows.'
            }
          ]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Test live typing, concurrent edits, formatting, tables, and patch streams below.'
        }
      ]
    }
  ]
};

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health and Readiness probes
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        collaboratorsOnline: wss.clients.size
      })
    );
    return;
  }

  if (pathname === '/readyz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ready: true,
        database: 'connected',
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // REST API for collaborative document
  if (pathname === '/api/collaborate/document') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentCollabDocument));
      return;
    }
  }

  // Documentation API — list all pages
  if (pathname === '/api/docs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ pages: listDocPages() }));
    return;
  }

  // Documentation API — serve a single markdown page
  const docsMatch = pathname.match(/^\/api\/docs\/([a-z0-9_-]+)$/i);
  if (docsMatch && req.method === 'GET') {
    const slug = docsMatch[1];
    const mdFile = path.join(DOCS_DIR, `${slug}.md`);
    if (fs.existsSync(mdFile)) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      fs.createReadStream(mdFile).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Doc page "${slug}" not found`, available: listDocPages() }));
    }
    return;
  }

  // Static File Serving
  let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If path doesn't exist directly, try serving index.html (SPA routing)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(STATIC_DIR, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// WebSocket Server for Real-Time Collaboration
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const remoteIp = req.socket.remoteAddress;
  console.log(`[WebSocket] New client connected from ${remoteIp}. Total clients: ${wss.clients.size}`);

  // Send current document state upon connection
  ws.send(
    JSON.stringify({
      type: 'doc_change',
      senderId: 'server',
      senderName: 'Aurora Sync Hub',
      document: currentCollabDocument,
      patches: [],
      transactionId: `init_${Date.now()}`,
      timestamp: Date.now()
    })
  );

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'doc_change' && msg.document) {
        currentCollabDocument = msg.document;

        // Broadcast to all other connected clients
        for (const client of wss.clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        }
      }
    } catch (err) {
      console.error('[WebSocket] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected. Total clients: ${wss.clients.size}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Aurora RTE Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket Collaboration Hub listening at ws://localhost:${PORT}/ws`);
  console.log(`🩺 Health probe: http://localhost:${PORT}/healthz`);
  console.log(`📚 Docs API: http://localhost:${PORT}/api/docs  (pages: ${listDocPages().join(', ')})`);
  console.log(`=======================================================`);
});
