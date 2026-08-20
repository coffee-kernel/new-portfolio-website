/**
 * dev-server.js
 * A tiny zero-dependency local dev server that mimics Vercel's routing:
 *   - Serves static files from the project root
 *   - Routes /api/<name> requests to api/<name>.js (Vercel-style serverless functions)
 *
 * This is purely a convenience for local testing without the Vercel CLI.
 * For production-accurate local dev, prefer `vercel dev` (see README).
 *
 * Usage: node dev-server.js  (then open http://localhost:3000)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

async function handleApi(req, res, apiName, query) {
  const modulePath = path.join(ROOT, 'api', `${apiName}.js`);
  if (!fs.existsSync(modulePath)) {
    return sendJson(res, 404, { error: 'API route not found' });
  }

  // Emulate Vercel's (req, res) handler signature with req.query / req.body
  req.query = query;

  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      runHandler();
    });
  } else {
    req.body = {};
    runHandler();
  }

  function runHandler() {
    // Minimal res.status().json() shim
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
      return res;
    };

    // Note: module cache is intentionally NOT cleared here so in-memory state
    // (e.g. the contact form's rate limiter) behaves like a warm Vercel instance.
    // Restart the dev server to pick up code changes to files in /api.
    const handler = require(modulePath);
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error(err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal Server Error' });
    });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;
  const query = Object.fromEntries(url.searchParams.entries());

  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').split('/')[0];
    return handleApi(req, res, apiName, query);
  }
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
});
