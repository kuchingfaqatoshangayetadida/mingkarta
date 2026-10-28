// Ming karta o'yini: standalone HTTP (statik dist) + WebSocket server
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupWebSocketServer } from './server/gameServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST = path.join(__dirname, 'dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  if (u === '/ice.json') {
    const t = process.env.TURN_URL;
    const iceServers = t ? [{ urls: t.split(',').map(x => x.trim()).filter(Boolean), username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' }] : [];
    r.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ iceServers }));
    return;
  }
  const f = path.join(DIST, path.normalize(u));
  if (!f.startsWith(DIST)) {
    r.writeHead(403).end();
    return;
  }
  fs.readFile(f, (e, d) => {
    if (e) {
      // SPA fallback
      fs.readFile(path.join(DIST, 'index.html'), (err2, d2) => {
        if (err2) {
          r.writeHead(404).end('404');
        } else {
          r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(d2);
        }
      });
      return;
    }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }).end(d);
  });
});

setupWebSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Ming serveri ishga tushdi: port ' + PORT);
});
