import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};
const port = Number(process.env.PORT || 4173);

// Service binding: Vercel injects FIXTRACK_SOURCE_URL for the internal fixtrack_source service
function getBackendTarget(reqUrl) {
  const backendBase = process.env.FIXTRACK_SOURCE_URL || 'http://127.0.0.1:4174';
  return new URL(reqUrl, backendBase);
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(reqUrl.pathname);

    // Forward API requests to internal backend service via service binding
    if (pathname.startsWith('/api/') || pathname === '/api') {
      const targetUrl = getBackendTarget(req.url);
      try {
        const headers = { ...req.headers };
        delete headers.host;
        delete headers['accept-encoding'];

        let body = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          body = Buffer.concat(chunks);
        }

        const upstreamRes = await fetch(targetUrl, {
          method: req.method,
          headers,
          body,
          redirect: 'manual'
        });

        const resHeaders = {};
        upstreamRes.headers.forEach((val, key) => {
          const lower = key.toLowerCase();
          if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(lower)) {
            resHeaders[key] = val;
          }
        });

        const data = await upstreamRes.arrayBuffer();
        const buffer = Buffer.from(data);
        resHeaders['content-length'] = buffer.length;
        res.writeHead(upstreamRes.status, resHeaders);
        res.end(buffer);
        return;
      } catch (upstreamErr) {
        console.error('Error forwarding request to fixtrack_source service:', upstreamErr.message);
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          error: 'Bad Gateway: fixtrack_source backend service unreachable',
          target: targetUrl.href,
          details: upstreamErr.message
        }));
        return;
      }
    }

    // Static file serving for SPA
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (pathname.includes('/.') || pathname.startsWith('/tests') || pathname.endsWith('.md')) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      if (!(await stat(file)).isFile()) file = path.join(root, 'index.html');
    } catch {
      if (path.extname(pathname)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      file = path.join(root, 'index.html');
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin'
    });
    res.end(await readFile(file));
  } catch (err) {
    res.writeHead(500);
    res.end('Unable to serve this page');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`FixTrack Frontend (app) running on port ${port}`);
  if (process.env.FIXTRACK_SOURCE_URL) {
    console.log(`Bound to fixtrack_source at ${process.env.FIXTRACK_SOURCE_URL}`);
  }
});
