import { chromium } from 'playwright';
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const databasePath = process.env.DATABASE_PATH ?? resolve('apps/api/data/vidhyasaathy-v9b.db');
const outDir = resolve('e2e/screenshots/games');
mkdirSync(outDir, { recursive: true });
mkdirSync(resolve(outDir, 'videos'), { recursive: true });

const db = new Database(databasePath);
try { db.prepare('DELETE FROM rate_limit').run(); } catch {}
const profile = db.prepare("SELECT id, school_id FROM profile WHERE role = 'student' LIMIT 1").get();
const chapter = db.prepare("SELECT id FROM chapter WHERE title LIKE '%Motion%' LIMIT 1").get()
  || db.prepare('SELECT id FROM chapter LIMIT 1').get();
const token = randomBytes(32).toString('base64url');
db.prepare('INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
  createHash('sha256').update(token).digest('hex'), profile.id, profile.school_id, Date.now() + 604800000, Date.now(),
);
db.close();

async function waitAct(page, timeout = 40000) {
  await page.waitForSelector('[data-afv-phase="act"]', { timeout });
}

async function doAct(page, kind) {
  await waitAct(page);
  await page.waitForTimeout(400);
  if (kind === 'tap') {
    const nuc = page.locator('[data-afv-hotspot="nucleus"]');
    await nuc.first().click({ force: true });
  } else {
    const assist = page.locator(`[data-afv-assist="${kind}"]`);
    if (await assist.count()) await assist.first().click();
    else {
      // fallback: click drop zone center via mouse after grabbing electron hotspot
      const el = page.locator('[data-afv-electron="1"]');
      const drop = page.locator(`[data-afv-drop="${kind}"]`);
      const a = await el.boundingBox();
      const b = await drop.boundingBox();
      if (a && b) {
        await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
        await page.mouse.down();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
        await page.mouse.up();
      }
    }
  }
  await page.waitForTimeout(1800);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: resolve(outDir, 'videos'), size: { width: 1440, height: 900 } },
});
await context.addCookies([{ name: 'vidhyasaathy_session', value: token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const page = await context.newPage();
const url = `/student/chapters/${chapter.id}/practice/engine/atom`;
console.log('goto', url);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.afv, [data-afv-begin]', { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: resolve(outDir, 'atom-forge-3d-1-intro.png'), fullPage: false });

await page.locator('[data-afv-begin="1"]').click();
await page.waitForSelector('[data-afv-playing]', { timeout: 15000 });
await page.waitForTimeout(2800);
await page.screenshot({ path: resolve(outDir, 'atom-forge-3d-2-playing.png'), fullPage: false });

await doAct(page, 'tap'); // zoom -> nucleus tap
await page.screenshot({ path: resolve(outDir, 'atom-forge-3d-3-nucleus.png'), fullPage: false });
await doAct(page, 'tap'); // nucleus episode
await doAct(page, 'k');
await page.screenshot({ path: resolve(outDir, 'atom-forge-3d-4-act.png'), fullPage: false });
await doAct(page, 'm');
await doAct(page, 'cl');

await page.waitForSelector('text=Salt forged from atoms', { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(1500);

const video = page.video();
await context.close();
await browser.close();

const dest = resolve(outDir, 'atom-forge-3d.webm');
if (video) {
  const raw = await video.path();
  try { renameSync(raw, dest); } catch { copyFileSync(raw, dest); try { unlinkSync(raw); } catch {} }
  console.log('VIDEO', dest, existsSync(dest));
}
console.log('done');
