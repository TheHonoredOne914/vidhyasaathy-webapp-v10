import { mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import Database from 'better-sqlite3';
import { baseURL, databasePath, ensureServers, stopServers } from './server.ts';

const shotDir = resolve('e2e/screenshots/v9-interim');
const gameDir = resolve('e2e/screenshots/games');
const outVideoDir = resolve('e2e/screenshots/games/videos');

function openDb() {
  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');
  return db;
}

function seedDemoIntoE2e() {
  const env = {
    ...process.env,
    DATABASE_PATH: databasePath,
    DEMO_PASSWORD: 'Saathy@2026',
    DEMO_PIN: '2468',
    DEMO_SEED: 'true',
  };
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const migrate = spawnSync(npm, ['run', 'db:migrate', '-w', 'apps/api'], { cwd: process.cwd(), env, encoding: 'utf8', shell: true });
  if (migrate.status !== 0) throw new Error(`migrate failed\n${migrate.stdout}\n${migrate.stderr}`);
  const seed = spawnSync(npm, ['run', 'db:seed', '-w', 'apps/api'], { cwd: process.cwd(), env, encoding: 'utf8', shell: true });
  if (seed.status !== 0) throw new Error(`seed failed\n${seed.stdout}\n${seed.stderr}`);
}

function sessionForRole(role: string): string {
  const db = openDb();
  const profile = db.prepare('SELECT id, school_id FROM profile WHERE role = ? LIMIT 1').get(role) as
    | { id: string; school_id: string }
    | undefined;
  if (!profile) {
    db.close();
    throw new Error(`No ${role} profile after seed`);
  }
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = Date.now();
  db.prepare(
    'INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(tokenHash, profile.id, profile.school_id, now + 604800000, now);
  db.close();
  return token;
}

async function pointerDrag(page: Page, selector: string, dx: number, dy: number) {
  const handle = page.locator(selector).first();
  await expect(handle).toBeVisible({ timeout: 20000 });
  const box = await handle.boundingBox();
  if (!box) throw new Error(`No box for ${selector}`);
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx / 2, startY + dy / 2, { steps: 8 });
  await page.mouse.move(startX + dx, startY + dy, { steps: 12 });
  await page.mouse.up();
}

async function saveVideo(page: Page, name: string) {
  mkdirSync(outVideoDir, { recursive: true });
  await page.context().close();
}

test.describe.configure({ mode: 'serial', timeout: 300000 });
test.use({
  baseURL,
  video: { mode: 'on', size: { width: 1440, height: 900 } },
  viewport: { width: 1440, height: 900 },
});

let studentToken = '';

test.beforeAll(async () => {
  mkdirSync(shotDir, { recursive: true });
  mkdirSync(gameDir, { recursive: true });
  mkdirSync(outVideoDir, { recursive: true });
  await ensureServers();
  seedDemoIntoE2e();
  studentToken = sessionForRole('student');
});

test.afterAll(async () => {
  await stopServers();
});

test('phase3 UX shells at 1440 and 360', async ({ browser }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    { name: 'vidhyasaathy_session', value: studentToken, url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
  const page = await context.newPage();
  for (const [path, name] of [
    ['/student', 'home'],
    ['/student/subjects', 'subjects'],
    ['/student/sessions', 'sessions'],
    ['/student/notifications', 'notifications'],
    ['/student/settings', 'settings'],
    ['/privacy', 'privacy'],
  ] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: resolve(shotDir, `ux-${name}-1440.png`), fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(shotDir, `ux-${name}-360.png`), fullPage: true });
  }
  await context.close();
});

test('Atom Forge drag changes sim state', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: outVideoDir, size: { width: 1440, height: 900 } },
  });
  await context.addCookies([
    { name: 'vidhyasaathy_session', value: studentToken, url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
  const page = await context.newPage();
  await page.goto('/student/chapters/demo/practice/engine/atom?level=1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('atom-stage')).toBeVisible({ timeout: 25000 });
  await expect(page.getByTestId('atom-narrate')).toContainText(/Drag/i);
  await page.waitForTimeout(400);
  await pointerDrag(page, '[data-testid="tray-electron"]', 200, -200);
  await page.waitForTimeout(700);
  const electrons = await page.locator('[data-testid^="electron-"]').count();
  expect(electrons).toBeGreaterThan(0);
  await page.screenshot({ path: resolve(gameDir, 'atom-forge-level1.png'), fullPage: true });
  await context.close();
  // rename newest webm
  const files = readdirSync(outVideoDir).filter((f) => f.endsWith('.webm')).map((f) => ({ f, m: statSync(resolve(outVideoDir, f)).mtimeMs }));
  files.sort((a, b) => b.m - a.m);
  if (files[0]) copyFileSync(resolve(outVideoDir, files[0].f), resolve(gameDir, 'atom-forge.webm'));
});

test('Cricket Lab drag changes force meter', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: outVideoDir, size: { width: 1440, height: 900 } },
  });
  await context.addCookies([
    { name: 'vidhyasaathy_session', value: studentToken, url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
  const page = await context.newPage();
  await page.goto('/student/chapters/demo/practice/engine/newton?level=2', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('newton-stage')).toBeVisible({ timeout: 25000 });
  await expect(page.getByTestId('newton-narrate')).toContainText(/Drag/i);
  const before = await page.getByTestId('accel-readout').innerText();
  await pointerDrag(page, '[data-testid="force-handle"]', 140, 0);
  await page.waitForTimeout(500);
  const after = await page.getByTestId('accel-readout').innerText();
  expect(after).not.toEqual(before);
  await page.screenshot({ path: resolve(gameDir, 'cricket-lab-level2.png'), fullPage: true });
  await context.close();
  const files = readdirSync(outVideoDir).filter((f) => f.endsWith('.webm')).map((f) => ({ f, m: statSync(resolve(outVideoDir, f)).mtimeMs }));
  files.sort((a, b) => b.m - a.m);
  if (files[0]) copyFileSync(resolve(outVideoDir, files[0].f), resolve(gameDir, 'cricket-lab.webm'));
});
