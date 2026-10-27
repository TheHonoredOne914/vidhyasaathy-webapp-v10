import { type ChildProcess, spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
export const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
export const databasePath = process.env.E2E_DATABASE_PATH ?? resolve(repoRoot, 'apps/api/data/e2e.db');

let api: ChildProcess | undefined;
let web: ChildProcess | undefined;

function logsOf(child: ChildProcess): string[] {
  const lines: string[] = [];
  const push = (chunk: Buffer) => {
    lines.push(chunk.toString());
    if (lines.length > 50) lines.shift();
  };
  child.stdout?.on('data', push);
  child.stderr?.on('data', push);
  return lines;
}

async function waitForHttp(url: string, child: ChildProcess, logs: string[]): Promise<void> {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${url} exited\n${logs.join('')}`);
    try {
      const response = await fetch(url);
      await response.text();
      if (response.status < 500) return;
    } catch {
      await new Promise((resolvePromise) => { setTimeout(resolvePromise, 200); });
      continue;
    }
    await new Promise((resolvePromise) => { setTimeout(resolvePromise, 200); });
  }
  throw new Error(`Timed out waiting for ${url}\n${logs.join('')}`);
}

export async function ensureServers(): Promise<void> {
  if (process.env.E2E_BASE_URL) return;
  mkdirSync(resolve(databasePath, '..'), { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) rmSync(`${databasePath}${suffix}`, { force: true });
  const shared = { ...process.env, NODE_ENV: 'development' };
  api = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: resolve(repoRoot, 'apps/api'),
    env: {
      ...shared,
      APP_ORIGIN: baseURL,
      API_HOST: '127.0.0.1',
      API_PORT: '3001',
      DATABASE_PATH: databasePath,
      AUTH_RATE_LIMIT_MAX: '500',
      CLAIM_CODE_ENCRYPTION_KEY: '11'.repeat(32),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  web = spawn(process.execPath, [resolve(repoRoot, 'apps/web/node_modules/vite/bin/vite.js')], {
    cwd: resolve(repoRoot, 'apps/web'),
    env: { ...shared, VITE_API_URL: '/api', VITE_API_PROXY_TARGET: 'http://127.0.0.1:3001' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const apiLogs = logsOf(api);
  const webLogs = logsOf(web);
  await waitForHttp('http://127.0.0.1:3001/', api, apiLogs);
  await waitForHttp(baseURL, web, webLogs);
}

export async function stopServers(): Promise<void> {
  for (const child of [web, api]) {
    if (child && child.exitCode === null) child.kill();
  }
  await Promise.all([web, api].map((child) => new Promise<void>((resolvePromise) => {
    if (!child || child.exitCode !== null) {
      resolvePromise();
      return;
    }
    child.once('exit', () => { resolvePromise(); });
  })));
}
