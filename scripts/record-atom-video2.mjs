import { chromium } from 'playwright';
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const databasePath = process.env.DATABASE_PATH ?? resolve('apps/api/data/vidhyasaathy-v9b.db');
const outDir = resolve('e2e/screenshots/games');
const laptopDir = process.env.LAPTOP_SHOTS;
mkdirSync(outDir, { recursive: true });
mkdirSync(resolve(outDir, 'videos'), { recursive: true });

const db = new Database(databasePath);
try { db.prepare('DELETE FROM rate_limit').run(); } catch {}
const profile = db.prepare("SELECT id, school_id FROM profile WHERE role = 'student' LIMIT 1").get();
const chapter = db.prepare("SELECT id FROM chapter WHERE title LIKE '%Motion%' LIMIT 1").get() || db.prepare('SELECT id FROM chapter LIMIT 1').get();
const token = randomBytes(32).toString('base64url');
db.prepare('INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
  createHash('sha256').update(token).digest('hex'), profile.id, profile.school_id, Date.now() + 604800000, Date.now(),
);
db.close();

async function waitAct(page, timeout = 35000) {
  await page.waitForSelector('[data-afv-phase="act"]', { timeout });
}

async function dragTo(page, dropSel) {
  const electron = page.locator('[data-afv-electron="1"]');
  await electron.waitFor({ timeout: 10000 });
  const box = await electron.boundingBox();
  let tbox = null;
  const target = page.locator(dropSel).first();
  try {
    await target.waitFor({ state: 'attached', timeout: 8000 });
    tbox = await target.boundingBox();
  } catch {}
  if (!tbox) {
    const stage = page.locator('.afv-stage-wrap');
    const sbox = await stage.boundingBox();
    if (!sbox) throw new Error('no stage');
    // fallback: K center / M outer / Cl right
    if (dropSel.includes('k')) tbox = { x: sbox.x + sbox.width * 0.5 - 20, y: sbox.y + sbox.height * 0.55 - 20, width: 40, height: 40 };
    else if (dropSel.includes('m')) tbox = { x: sbox.x + sbox.width * 0.5 - 20, y: sbox.y + sbox.height * 0.28, width: 40, height: 40 };
    else tbox = { x: sbox.x + sbox.width * 0.65 - 20, y: sbox.y + sbox.height * 0.55 - 20, width: 40, height: 40 };
  }
  if (!box || !tbox) throw new Error('missing drag boxes');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(tbox.x + tbox.width / 2, tbox.y + tbox.height / 2, { steps: 24 });
  await page.mouse.up();
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
await page.waitForTimeout(600);
await page.screenshot({ path: resolve(outDir, 'atom-forge-video-1-intro.png'), fullPage: false });

const begin = page.locator('[data-afv-begin="1"]');
if (await begin.count()) await begin.click();
else await page.getByRole('button', { name: /Begin episode/i }).click();

await page.waitForSelector('[data-afv-playing]', { timeout: 15000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: resolve(outDir, 'atom-forge-video-2-playing.png'), fullPage: false });

// Ep1 tap nucleus — may need to wait up to actAt (~11s from start)
await waitAct(page, 40000);
const nuc = page.locator('[data-afv-hotspot="nucleus"], [data-afv-nucleus="1"]'); await nuc.first().click({ force: true });
await page.waitForTimeout(2000);

// Ep2 drag K
await waitAct(page, 40000);
await dragTo(page, '[data-afv-drop="k"]');
await page.waitForTimeout(2000);

// Ep3 drag M
await waitAct(page, 45000);
await page.screenshot({ path: resolve(outDir, 'atom-forge-video-3-act.png'), fullPage: false });
await dragTo(page, '[data-afv-drop="m"]');
await page.waitForTimeout(2000);

// Ep4 bond
await waitAct(page, 45000);
await dragTo(page, '[data-afv-drop="cl"]');
await page.waitForTimeout(2800);
await page.waitForSelector('text=You forged the atom story', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);

const video = page.video();
await context.close();
await browser.close();

const dest = resolve(outDir, 'atom-forge-video.webm');
if (video) {
  const raw = await video.path();
  try { renameSync(raw, dest); } catch { copyFileSync(raw, dest); try { unlinkSync(raw); } catch {} }
  console.log('VIDEO', dest, existsSync(dest));
}
if (laptopDir) {
  mkdirSync(laptopDir, { recursive: true });
  for (const f of ['atom-forge-video.webm', 'atom-forge-video-1-intro.png', 'atom-forge-video-2-playing.png', 'atom-forge-video-3-act.png']) {
    const src = resolve(outDir, f);
    if (existsSync(src)) copyFileSync(src, resolve(laptopDir, f));
  }
}
console.log('done');
