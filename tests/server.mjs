/* A fake chatgpt.com. Local only, self-signed, no real data. */
import https from 'node:https';
import fs from 'node:fs';
import { ensureCert, PORT } from './lib.mjs';

const TITLES = [
  'Project kickoff notes',
  'SQL window functions',
  'Trip planning',
  'Rewrite my resume',
  'Debugging a bash loop',
  'Recipe ideas',
  'Quarterly review draft',
  'Regex cheat sheet',
];

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>chatgpt.com — local test page</title>
<style>
  html, body { margin: 0; height: 100%; }
  body { background: #212121; color: #6f6f6f; font: 13px system-ui, sans-serif; }
  p { position: absolute; top: 18px; left: 20px; }
</style></head>
<body><p>Local test page · fake data · no account involved</p></body></html>`;

export function startServer({ count = TITLES.length } = {}) {
  const { key, cert } = ensureCert();
  const conversations = new Map();
  const calls = [];

  TITLES.slice(0, count).forEach((title, index) => {
    const id = 'conv-' + (index + 1);
    conversations.set(id, {
      id,
      title,
      create_time: 1780000000 + index * 1000,
      update_time: 1780000000 + index * 1000,
      mapping: {},
      current_node: 'node',
    });
  });

  const server = https.createServer(
    { key: fs.readFileSync(key), cert: fs.readFileSync(cert) },
    (req, res) => {
      const url = new URL(req.url, 'https://chatgpt.com');
      calls.push({ method: req.method, path: url.pathname, query: url.search });

      if (req.method === 'GET' && url.pathname === '/api/auth/session') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ accessToken: 'test-token', account: { id: 'acc-1' } }));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/backend-api/conversations') {
        const offset = Number(url.searchParams.get('offset') || 0);
        const limit = Number(url.searchParams.get('limit') || 28);
        const archived = url.searchParams.get('is_archived') === 'true';
        const all = archived ? [] : [...conversations.values()];
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            items: all.slice(offset, offset + limit),
            total: all.length,
            limit,
            offset,
          })
        );
        return;
      }

      const del = url.pathname.match(/^\/backend-api\/conversation\/id\/(.+)$/);
      if (req.method === 'DELETE' && del) {
        const removed = conversations.delete(decodeURIComponent(del[1]));
        res.writeHead(removed ? 200 : 404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ success: removed }));
        return;
      }

      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(PAGE);
    }
  );

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', () => {
      resolve({
        calls,
        conversations,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}
