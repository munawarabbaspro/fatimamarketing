// Tiny static server for local testing: node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const port = +(process.argv[2] || 4173);
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(DIST, p);
  if (!f.startsWith(DIST)) { res.statusCode = 404; return res.end('Not found'); }
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = join(DIST, '404.html'); res.statusCode = 404; }
  try {
    const buf = await readFile(f); const type = T[extname(f)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && type === 'video/mp4') {
      const [s, e] = range.replace('bytes=', '').split('-'); const start = +s, end = e ? +e : buf.length - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return res.end(buf.subarray(start, end + 1));
    }
    res.setHeader('Content-Type', type); res.setHeader('Accept-Ranges', 'bytes');
    // mimic production hosting: long cache for fingerprinted assets, gzip for text
    if (p.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) { res.setHeader('Content-Encoding', 'gzip'); return res.end(gzipSync(buf)); }
    res.end(buf);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Serving dist on http://localhost:${port}`));
