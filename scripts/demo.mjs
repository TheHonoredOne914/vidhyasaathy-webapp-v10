import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const apiPort = Number(process.env.API_PORT ?? 3001);
const webPort = Number(process.env.WEB_PORT ?? 5173);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = {
  ...process.env,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? '5000',
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX ?? '500',
  DEMO_SEED: 'true',
  DEMO_PASSWORD: 'Saathy@2026!',
  DEMO_PIN: '2468',
  // Keeps the documented staff password working on an existing demo database.
  DEMO_RESET_LOGINS: 'true',
  BACKUP_DIRECTORY: process.env.BACKUP_DIRECTORY ?? join(homedir(), 'vidhyasaathy-demo-backups'),
  API_PORT: String(apiPort),
  APP_ORIGIN: `http://127.0.0.1:${webPort}`,
  VITE_API_URL: '/api',
  VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
  CLAIM_CODE_ENCRYPTION_KEY: process.env.CLAIM_CODE_ENCRYPTION_KEY ?? randomBytes(32).toString('hex'),
};

const steps = [['run', 'db:migrate', '-w', 'apps/api'], ['run', 'db:seed', '-w', 'apps/api']];
if (existsSync(resolve('apps/api', env.DATABASE_PATH ?? './data/vidhyasaathy.db'))) {
  steps.unshift(['run', 'db:backup', '-w', 'apps/api']);
}
for (const args of steps) {
  const result = spawnSync(npm, args, { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Only the explicit local demo exposes its seeded names to a fresh browser.
// PIN verification still goes through the normal server-side sign-in route.
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const Database = require('better-sqlite3');
const db = new Database(resolve('apps/api', env.DATABASE_PATH ?? './data/vidhyasaathy.db'), { readonly: true, fileMustExist: true });
try {
  env.VITE_DEMO_STUDENTS = JSON.stringify(db.prepare(`SELECT p.id, p.name, s.name AS school
    FROM profile p JOIN school s ON s.id = p.school_id
    WHERE p.role = 'student' AND s.id = 'd7000000-0000-4000-8000-000000000001'
    ORDER BY CAST(p.roll_number AS INTEGER), p.name`).all());
} finally { db.close(); }

const children = [
  spawn(npm, ['run', 'dev', '-w', 'apps/api'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev', '-w', 'apps/web', '--', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort', '--configLoader', 'native'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' }),
];
const stop = (signal) => { for (const child of children) child.kill(signal); };
process.on('SIGINT', () => { stop('SIGINT'); process.exit(130); });
process.on('SIGTERM', () => { stop('SIGTERM'); process.exit(143); });
for (const child of children) child.on('exit', (code) => { if (code !== 0) { stop('SIGTERM'); process.exit(code ?? 1); } });
