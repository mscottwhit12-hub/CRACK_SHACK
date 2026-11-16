// Crack Shack server: serves the app and keeps one shared layout for every device.
// No dependencies. Layout is stored as JSON in DATA_DIR (mount a volume there).
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const APP_DIR = path.resolve(process.env.APP_DIR || path.join(__dirname, '..', 'app'));
const DATA_DIR = path.resolve(process.env.DATA_DIR || '/data');
const LAYOUT = path.join(DATA_DIR, 'layout.json');
const MAX_BODY = 2 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

fs.mkdirSync(DATA_DIR, { recursive: true });

function readLayout() {
  try { return JSON.parse(fs.readFileSync(LAYOUT, 'utf8')); } catch (e) { return null; }
}
function writeLayout(doc) {
  const tmp = LAYOUT + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(doc));
  fs.renameSync(tmp, LAYOUT);                       // atomic replace, so a crash never leaves half a file
}
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/api/health') return send(res, 200, { ok: true });

  if (url.pathname === '/api/layout') {
    if (req.method === 'GET') {
      const doc = readLayout();
      return doc ? send(res, 200, doc) : send(res, 200, { rev: 0, layout: null });
    }
    if (req.method === 'PUT') {
      let size = 0; const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) { send(res, 413, { error: 'Layout is too large.' }); req.destroy(); }
        else chunks.push(c);
      });
      req.on('end', () => {
        if (res.writableEnded) return;
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return send(res, 400, { error: 'Not JSON.' }); }
        if (!body || typeof body.layout !== 'object' || body.layout === null) return send(res, 400, { error: 'Missing layout.' });
        // last write wins; rev lets other devices notice the change
        const doc = { rev: Date.now(), by: String(body.client || '').slice(0, 64), layout: body.layout };
        try { writeLayout(doc); } catch (e) { return send(res, 500, { error: 'Could not save: ' + e.message }); }
        return send(res, 200, { rev: doc.rev });
      });
      return;
    }
    return send(res, 405, { error: 'Use GET or PUT.' });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(APP_DIR, '.' + rel);
  if (!file.startsWith(APP_DIR + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': rel === '/index.html' ? 'no-cache' : 'public, max-age=86400' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.listen(PORT, () => console.log(`Crack Shack on :${PORT} (app ${APP_DIR}, data ${DATA_DIR})`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
