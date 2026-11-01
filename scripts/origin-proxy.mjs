// Preview helper: forwards ORIGIN_PROXY_PORT (default 3002) -> API (127.0.0.1:${API_PORT})
// and maps an allow-listed browser Origin onto APP_ORIGIN so the API's CSRF check
// passes for the local port and the preview domain. Any other Origin (or a missing
// Origin on a state-changing request) is forwarded untouched, so the API rejects it.
// Extra origins: ORIGIN_PROXY_ALLOWED_ORIGINS=https://a.example,https://b.example
import http from 'node:http';

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = Number(process.env.API_PORT ?? 3001);
const LISTEN_PORT = Number(process.env.ORIGIN_PROXY_PORT ?? 3002);
const APP_ORIGIN = process.env.APP_ORIGIN ?? `http://127.0.0.1:${LISTEN_PORT}`;

const WEB_PORT = process.env.WEB_PORT ?? '3000';
const ALLOWED = new Set([
  APP_ORIGIN,
  `http://127.0.0.1:${WEB_PORT}`,
  `http://localhost:${WEB_PORT}`,
  ...(process.env.ORIGIN_PROXY_ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean),
].map((value) => value.replace(/\/+$/, '')));

const server = http.createServer((req, res) => {
  const headers = { ...req.headers };
  const incoming = typeof headers.origin === 'string' ? headers.origin.replace(/\/+$/, '') : undefined;
  if (incoming && ALLOWED.has(incoming)) headers.origin = APP_ORIGIN;
  headers.host = `${TARGET_HOST}:${TARGET_PORT}`;

  const upstream = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      method: req.method,
      path: req.url,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );

  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'UPSTREAM_UNAVAILABLE', message: String(err) }));
  });

  req.pipe(upstream);
});

server.listen(LISTEN_PORT, '127.0.0.1', () => {
  console.log(`origin-proxy listening on 127.0.0.1:${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT} (origin=${APP_ORIGIN}, allowed=${[...ALLOWED].join(' ')})`);
});
