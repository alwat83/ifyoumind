// Serves the local (demo-project) build with the SPA fallback Firebase Hosting uses.
// Binds to 127.0.0.1 only. Usage: node e2e/support/static-server.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist/ifyoumind-local/browser');
const port = Number(process.argv[2] || process.env.QA_PORT || 4300);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };

async function file(path) {
  try { return (await stat(path)).isFile() ? path : null; } catch { return null; }
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const requested = normalize(join(root, decodeURIComponent(url.pathname)));
  const target = (requested.startsWith(root) && await file(requested)) ||
    await file(join(requested, 'index.html')) || join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(await readFile(target));
}).listen(port, '127.0.0.1', () => console.log(`QA static server on http://127.0.0.1:${port}`));
