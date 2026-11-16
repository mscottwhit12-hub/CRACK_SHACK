// Crack Shack server: serves the app and keeps one shared layout for every device.
// No dependencies. Layout is stored as JSON in DATA_DIR (mount a volume there).
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const APP_DIR = path.resolve(process.env.APP_DIR || path.join(__dirname, '..', 'app'));
const DATA_DIR = path.resolve(process.env.DATA_DIR || '/data');
const LAYOUT = path.join(DATA_DIR, 'layout.json');      // the shared, live layout
const SAVED = path.join(DATA_DIR, 'layouts');            // named layouts from Save > Shop server
const MAX_BODY = 2 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

// A data folder the app can't write to must not stop the app from loading: log it, keep serving, and saves report errors.
try { fs.mkdirSync(SAVED, { recursive: true }); fs.accessSync(DATA_DIR, fs.constants.W_OK); }
catch (e) { console.error(`Can't write to ${DATA_DIR} (${e.code}). Layouts won't save. On the host, run: sudo chown -R 1000:1000 <your data folder>`); }

function readLayout() {
  try { return JSON.parse(fs.readFileSync(LAYOUT, 'utf8')); } catch (e) { return null; }
}
function writeJSON(file, doc) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(doc));
  fs.renameSync(tmp, file);                         // atomic replace, so a crash never leaves half a file
}
function writeLayout(doc) { writeJSON(LAYOUT, doc); }
// file name = hex of the layout name: any name is safe on disk and can't escape the folder
function savedFile(name) { return path.join(SAVED, Buffer.from(name, 'utf8').toString('hex') + '.json'); }
function cleanName(raw) {
  let n; try { n = decodeURIComponent(raw); } catch (e) { return null; }
  n = n.replace(/[\u0000-\u001f]/g, '').trim();
  return n && n.length <= 80 ? n : null;
}
function readBody(req, res, done) {
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
    done(body);
  });
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
      return readBody(req, res, (body) => {
        // last write wins; rev lets other devices notice the change
        const doc = { rev: Date.now(), by: String(body.client || '').slice(0, 64), layout: body.layout };
        try { writeLayout(doc); } catch (e) { return send(res, 500, { error: 'Could not save: ' + e.message }); }
        send(res, 200, { rev: doc.rev });
      });
    }
    return send(res, 405, { error: 'Use GET or PUT.' });
  }

  // named layouts: GET /api/layouts lists them; GET, PUT, DELETE /api/layouts/<name>
  if (url.pathname === '/api/layouts') {
    if (req.method !== 'GET') return send(res, 405, { error: 'Use GET.' });
    const list = [];
    let files = []; try { files = fs.readdirSync(SAVED); } catch (e) {}
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try { const d = JSON.parse(fs.readFileSync(path.join(SAVED, f), 'utf8')); list.push({ name: d.name, savedAt: d.savedAt }); } catch (e) {}
    }
    list.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
    return send(res, 200, list);
  }
  if (url.pathname.startsWith('/api/layouts/')) {
    const name = cleanName(url.pathname.slice('/api/layouts/'.length));
    if (!name) return send(res, 400, { error: 'Bad layout name.' });
    const file = savedFile(name);
    if (req.method === 'GET') {
      try { return send(res, 200, JSON.parse(fs.readFileSync(file, 'utf8'))); } catch (e) { return send(res, 404, { error: 'No layout by that name.' }); }
    }
    if (req.method === 'PUT') {
      return readBody(req, res, (body) => {
        const doc = { name, savedAt: new Date().toISOString(), layout: body.layout };
        try { writeJSON(file, doc); } catch (e) { return send(res, 500, { error: 'Could not save: ' + e.message }); }
        send(res, 200, { name, savedAt: doc.savedAt });
      });
    }
    if (req.method === 'DELETE') {
      try { fs.unlinkSync(file); } catch (e) { return send(res, 404, { error: 'No layout by that name.' }); }
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'Use GET, PUT or DELETE.' });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, 'Bad path', 'text/plain'); }
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
