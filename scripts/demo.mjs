import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

const apiPort = Number(process.env.API_PORT ?? 3001);
const webPort = Number(process.env.WEB_PORT ?? 5173);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = {
  ...process.env,
  DEMO_SEED: 'true',
  DEMO_PASSWORD: 'Saathy@2026!',
  DEMO_PIN: '2468',
  // Keeps the documented staff password working on an existing demo database.
  DEMO_RESET_LOGINS: 'true',
  API_PORT: String(apiPort),
  APP_ORIGIN: `http://127.0.0.1:${webPort}`,
  VITE_API_URL: '/api',
  VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
  CLAIM_CODE_ENCRYPTION_KEY: process.env.CLAIM_CODE_ENCRYPTION_KEY ?? randomBytes(32).toString('hex'),
};

for (const args of [['run', 'db:migrate', '-w', 'apps/api'], ['run', 'db:seed', '-w', 'apps/api']]) {
  const result = spawnSync(npm, args, { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const children = [
  spawn(npm, ['run', 'dev', '-w', 'apps/api'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev', '-w', 'apps/web', '--', '--host', '127.0.0.1', '--port', String(webPort)], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' }),
];
const stop = (signal) => { for (const child of children) child.kill(signal); };
process.on('SIGINT', () => { stop('SIGINT'); process.exit(130); });
process.on('SIGTERM', () => { stop('SIGTERM'); process.exit(143); });
for (const child of children) child.on('exit', (code) => { if (code !== 0) { stop('SIGTERM'); process.exit(code ?? 1); } });
