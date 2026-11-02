// Local QA launcher. Preserves existing data; no seeding or reset commands.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import Database from 'better-sqlite3';

const root = process.cwd();
const target = resolve(root, 'apps/api/data/saathy-browser.db');
mkdirSync(resolve(root, 'apps/api/data'), { recursive: true });
if (!existsSync(target)) {
  if (process.env.SAATHY_SOURCE_DB) {
    const database = new Database(process.env.SAATHY_SOURCE_DB, { readonly: true, fileMustExist: true });
    await database.backup(target);
    database.close();
  } else {
    // Create demo content only when this dedicated QA database does not exist.
    await new Promise((accept, reject) => {
      const seed = spawn(process.execPath, ['--import', 'tsx', 'scripts/saathy-fixture.ts'], { cwd: root, env: { ...process.env, DATABASE_PATH: target }, stdio: 'inherit' });
      seed.on('exit', (code) => code === 0 ? accept() : reject(new Error(`QA fixture exited ${code}`)));
    });
  }
}
const env = {
  ...process.env, DATABASE_PATH: target, APP_ORIGIN: 'http://127.0.0.1:5183', API_PORT: '3183',
  AI_PROVIDER: 'stub', RATE_LIMIT_MAX: '10000', VITE_API_URL: '/api', VITE_API_PROXY_TARGET: 'http://127.0.0.1:3183',
};
const beforeMigration = new Database(target, { readonly: true, fileMustExist: true });
await beforeMigration.backup(`${target}.before-migration.sqlite`);
beforeMigration.close();
let api;
try { await fetch('http://127.0.0.1:3183/health', { signal: AbortSignal.timeout(2000) }); }
catch { api = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], { cwd: resolve(root, 'apps/api'), env, stdio: 'inherit' }); }
const requireWeb = createRequire(resolve(root, 'apps/web/package.json'));
let web;
try { await fetch('http://127.0.0.1:5183', { signal: AbortSignal.timeout(2000) }); }
catch { web = spawn(process.execPath, [resolve(dirname(requireWeb.resolve('vite/package.json')), 'bin/vite.js'), '--port', '5183', '--strictPort'], { cwd: resolve(root, 'apps/web'), env, stdio: 'inherit' }); }
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { api?.kill(); web?.kill(); process.exit(0); });
