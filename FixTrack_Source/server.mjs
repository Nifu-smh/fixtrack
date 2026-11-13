import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed, locations, categories, issueTypes } from './data.js';
import { STATUSES, PRIORITIES, metrics, findDuplicates } from './domain.js';
import * as dbApi from './supabase.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const port = Number(process.env.PORT || 4174);

// Helper to parse JSON body
async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// In-memory fallback if Supabase is offline / unconfigured
let fallbackDb = seed();

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(reqUrl.pathname);

  // Set standard API headers
  const sendJson = (statusCode, payload) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(payload, null, 2));
  };

  try {
    // 1. Health check
    if (pathname === '/api/health') {
      return sendJson(200, {
        status: 'ok',
        service: 'fixtrack_source',
        role: 'internal_backend',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Reports endpoint
    if (pathname === '/api/reports') {
      if (req.method === 'GET') {
        try {
          const live = await dbApi.fetchAllData();
          if (live && live.reports) {
            return sendJson(200, { success: true, count: live.reports.length, data: live.reports });
          }
        } catch {}
        return sendJson(200, { success: true, count: fallbackDb.reports.length, data: fallbackDb.reports });
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        try {
          const created = await dbApi.createReport(body);
          if (created) return sendJson(201, { success: true, data: created });
        } catch (dbErr) {
          console.warn('Fallback saving report locally:', dbErr.message);
        }
        const fallbackReport = {
          id: `rep-${Date.now()}`,
          caseId: null,
          title: body.title || 'Untitled Report',
          category: body.category || 'General',
          location: body.location || 'Campus',
          description: body.description || '',
          urgency: body.urgency || 'medium',
          status: 'submitted',
          createdAt: new Date().toISOString()
        };
        fallbackDb.reports.unshift(fallbackReport);
        return sendJson(201, { success: true, data: fallbackReport });
      }
    }

    // 3. Cases endpoint
    if (pathname === '/api/cases') {
      if (req.method === 'GET') {
        try {
          const live = await dbApi.fetchAllData();
          if (live && live.cases) {
            return sendJson(200, { success: true, count: live.cases.length, data: live.cases });
          }
        } catch {}
        return sendJson(200, { success: true, count: fallbackDb.cases.length, data: fallbackDb.cases });
      }
    }

    // Single case by ID: /api/cases/:id
    if (pathname.startsWith('/api/cases/')) {
      const caseId = pathname.replace('/api/cases/', '');
      if (req.method === 'GET') {
        let allCases = fallbackDb.cases;
        try {
          const live = await dbApi.fetchAllData();
          if (live && live.cases) allCases = live.cases;
        } catch {}
        const match = allCases.find(c => c.id === caseId || c.uuid === caseId);
        if (!match) return sendJson(404, { success: false, error: 'Case not found' });
        return sendJson(200, { success: true, data: match });
      }

      if (req.method === 'PATCH') {
        const body = await readJsonBody(req);
        try {
          const updated = await dbApi.updateCase(caseId, body);
          if (updated) return sendJson(200, { success: true, data: updated });
        } catch (dbErr) {
          console.warn('Fallback updating case locally:', dbErr.message);
        }
        const idx = fallbackDb.cases.findIndex(c => c.id === caseId || c.uuid === caseId);
        if (idx === -1) return sendJson(404, { success: false, error: 'Case not found' });
        fallbackDb.cases[idx] = { ...fallbackDb.cases[idx], ...body, updatedAt: new Date().toISOString() };
        return sendJson(200, { success: true, data: fallbackDb.cases[idx] });
      }
    }

    // 4. Analytics endpoints
    if (pathname === '/api/analytics' || pathname === '/api/analytics/overview') {
      let cases = fallbackDb.cases;
      let reports = fallbackDb.reports;
      try {
        const live = await dbApi.fetchAllData();
        if (live && live.cases) {
          cases = live.cases;
          reports = live.reports;
        }
      } catch {}
      const stats = metrics(cases, reports);
      return sendJson(200, { success: true, data: stats });
    }

    // 5. Technicians endpoint
    if (pathname === '/api/technicians') {
      let technicians = fallbackDb.technicians;
      try {
        const live = await dbApi.fetchAllData();
        if (live && live.technicians) technicians = live.technicians;
      } catch {}
      return sendJson(200, { success: true, count: technicians.length, data: technicians });
    }

    // Static files or fallback
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
    console.error('Server error in fixtrack_source:', err);
    sendJson(500, { success: false, error: err.message || 'Internal server error' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`FixTrack Backend (fixtrack_source) internal service running on port ${port}`);
});
