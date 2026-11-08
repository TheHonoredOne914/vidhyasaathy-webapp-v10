import { spawn } from 'node:child_process';

// Forward preview/local CLI options to Vite instead of concurrently swallowing
// --host/--port. The API and browser must agree on the selected web origin.
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : Number(process.env.WEB_PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid web port');
const viteArgs = portIndex >= 0 ? args : [...args, '--port', String(port)];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const apiPort = process.env.API_PORT ?? '3001';
const env = {
  ...process.env,
  API_PORT: apiPort,
  APP_ORIGIN: process.env.APP_ORIGIN ?? `http://127.0.0.1:${port}`,
  VITE_API_URL: process.env.VITE_API_URL ?? '/api',
  VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET ?? `http://127.0.0.1:${apiPort}`,
  VITE_ALLOWED_ORIGINS: process.env.VITE_ALLOWED_ORIGINS ?? `http://terminal.local:${port}`,
};
const children = [
  spawn(npm, ['run', 'dev', '-w', 'apps/web', '--', ...viteArgs], { env, stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev', '-w', 'apps/api'], { env, stdio: 'inherit', shell: process.platform === 'win32' }),
];
let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { stop(signal); });
for (const child of children) {
  child.once('error', () => { process.exitCode = 1; stop(); });
  child.once('exit', (code) => { if (!stopping) { process.exitCode = code ?? 1; stop(); } });
}
