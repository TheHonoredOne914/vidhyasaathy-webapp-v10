import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

/**
 * Preview/one-command launcher: `npm start`
 *
 * Same as `npm run demo`, but tuned for hosted preview environments:
 * - web binds 0.0.0.0:3000 (the externally exposed port)
 * - an origin-proxy hop rewrites Origin to APP_ORIGIN so the API's CSRF
 *   check passes for ANY browser origin (local port or preview domain)
 * - DEMO_LOOSE_AUTH=true so any name/PIN/password opens the prototype
 *
 * All knobs stay overridable via environment variables.
 */

const apiPort = Number(process.env.API_PORT ?? 3001);
const webPort = Number(process.env.WEB_PORT ?? 3000);
const webHost = process.env.WEB_HOST ?? '0.0.0.0';
const appOrigin = process.env.APP_ORIGIN ?? 'https://vidhyasaathy-preview.space-z.ai';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const env = {
  ...process.env,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? '5000',
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX ?? '500',
  DEMO_SEED: process.env.DEMO_SEED ?? 'true',
  DEMO_PASSWORD: process.env.DEMO_PASSWORD ?? 'Saathy@2026!',
  DEMO_PIN: process.env.DEMO_PIN ?? '2468',
  // Keeps the documented staff password working on an existing demo database.
  DEMO_RESET_LOGINS: process.env.DEMO_RESET_LOGINS ?? 'true',
  // Prototype convenience: any sign-in opens the app (dev/preview only).
  DEMO_LOOSE_AUTH: process.env.DEMO_LOOSE_AUTH ?? 'true',
  API_PORT: String(apiPort),
  APP_ORIGIN: appOrigin,
  VITE_API_URL: '/api',
  VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET ?? `http://127.0.0.1:${process.env.ORIGIN_PROXY_PORT ?? 3002}`,
  CLAIM_CODE_ENCRYPTION_KEY: process.env.CLAIM_CODE_ENCRYPTION_KEY ?? randomBytes(32).toString('hex'),
};

for (const args of [['run', 'db:migrate', '-w', 'apps/api'], ['run', 'db:seed', '-w', 'apps/api']]) {
  const result = spawnSync(npm, args, { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const children = [
  spawn(process.execPath, ['scripts/origin-proxy.mjs'], { cwd: process.cwd(), env, stdio: 'inherit' }),
  spawn(npm, ['run', 'start', '-w', 'apps/api'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev', '-w', 'apps/web', '--', '--host', webHost, '--port', String(webPort), '--strictPort'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' }),
];
const stop = (signal) => { for (const child of children) child.kill(signal); };
process.on('SIGINT', () => { stop('SIGINT'); process.exit(130); });
process.on('SIGTERM', () => { stop('SIGTERM'); process.exit(143); });
for (const child of children) child.on('exit', (code) => { if (code !== 0) { stop('SIGTERM'); process.exit(code ?? 1); } });
