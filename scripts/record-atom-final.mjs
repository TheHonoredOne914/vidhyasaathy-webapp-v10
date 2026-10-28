import { chromium } from 'playwright';
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const SHOTS_ONLY = process.env.SHOTS_ONLY === '1';
const outDir = resolve('e2e/screenshots/games/final');
mkdirSync(resolve(outDir, 'videos'), { recursive: true });
const db = new Database(resolve('apps/api/data/vidhyasaathy-v9b.db'));
try { db.prepare('DELETE FROM rate_limit').run(); } catch {}
const profile = db.prepare("SELECT id, school_id FROM profile WHERE role = 'student' LIMIT 1").get();
const chapter = db.prepare("SELECT id FROM chapter WHERE title LIKE '%Motion%' LIMIT 1").get() || db.prepare('SELECT id FROM chapter LIMIT 1').get();
const token = randomBytes(32).toString('base64url');
db.prepare('INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
  createHash('sha256').update(token).digest('hex'), profile.id, profile.school_id, Date.now() + 604800000, Date.now());
db.close();

const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctxOpts = { baseURL: 'http://127.0.0.1:5173', viewport: { width: 1280, height: 720 } };
if (!SHOTS_ONLY) ctxOpts.recordVideo = { dir: resolve(outDir, 'videos'), size: { width: 1280, height: 720 } };
const context = await browser.newContext(ctxOpts);
await context.addCookies([{ name: 'vidhyasaathy_session', value: token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 200)); });
const t0 = Date.now();
await page.goto(`/student/chapters/${chapter.id}/practice/engine/atom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('[data-afv-begin]', { timeout: 30000 });
await page.waitForTimeout(1500);
await page.locator('[data-afv-begin="1"]').click();
const state = () => page.evaluate(() => {
  const s = document.querySelector('[data-afv-phase]');
  return s ? { phase: s.getAttribute('data-afv-phase'), ep: s.getAttribute('data-afv-episode'), time: document.querySelector('[data-afv-time]')?.textContent } : null;
});
async function drag(kind) {
  const pts = await page.evaluate(() => { const c = document.querySelector('[data-afv-canvas] canvas'); return c ? { el: c.dataset.afvEl, tg: c.dataset.afvTarget } : null; });
  console.log('drag pts', kind, JSON.stringify(pts));
  if (!pts?.el || !pts?.tg) { await page.locator(`[data-afv-assist="${kind}"]`).first().click({ force: true }); return; }
  const [ax, ay] = pts.el.split(',').map(Number);
  const [bx, by] = pts.tg.split(',').map(Number);
  await page.mouse.move(ax, ay);
  await page.waitForTimeout(250);
  await page.mouse.down();
  await page.mouse.move(ax + (bx - ax) * 0.3, ay + (by - ay) * 0.3 - 40, { steps: 15 });
  await page.mouse.move(bx, by, { steps: 24 });
  const p2 = await page.evaluate(() => document.querySelector('[data-afv-canvas] canvas')?.dataset.afvTarget);
  if (p2) { const [cx, cy] = p2.split(',').map(Number); await page.mouse.move(cx, cy, { steps: 6 }); }
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(500);
  const st = await state();
  if (st?.phase === 'act') { console.log('drag did not register, using assist', kind); await page.locator(`[data-afv-assist="${kind}"]`).first().click({ force: true }); }
  else console.log('drag result', st?.phase, await page.evaluate(() => document.querySelector('[data-afv-branch]')?.getAttribute('data-afv-branch')));
}
const shotAt = { 'zoom:play:4': 1, 'nucleus:act': 2, 'shells:act': 3, 'bond:play:4': 4 };
const taken = new Set();
let last = '';
let epStart = {};
while (Date.now() - t0 < 150000) {
  const st = await state();
  if (!st) { await page.waitForTimeout(300); continue; }
  const key = `${st.phase}|${st.ep}|${st.time}`;
  if (key !== last) { console.log(((Date.now() - t0) / 1000).toFixed(1), st.phase, st.ep, st.time); last = key; }
  if (st.phase === 'done') break;
  if (st.phase === 'play') { epStart[st.ep] ??= Date.now(); }
  const secIn = st.ep && epStart[st.ep] ? Math.floor((Date.now() - epStart[st.ep]) / 1000) : 0;
  for (const [k, n] of (SHOTS_ONLY ? Object.entries(shotAt) : [])) {
    const [ep, ph, sec] = k.split(':');
    if (taken.has(n) || st.ep !== ep || st.phase !== ph || (sec && secIn < Number(sec))) continue;
    taken.add(n);
    await page.waitForTimeout(ph === 'act' ? 700 : 0);
    await page.screenshot({ path: resolve(outDir, `atom-forge-3d-final-${n}.png`) });
    console.log('SHOT', n);
  }
  if (st.phase === 'act') {
    await page.waitForTimeout(600);
    if (st.ep === 'zoom' || st.ep === 'nucleus') await page.locator('[data-afv-hotspot="nucleus"]').first().click({ force: true });
    else await drag(st.ep === 'shells' ? 'k' : st.ep === 'sodium' ? 'm' : 'cl');
    await page.waitForTimeout(400);
    const after = await state();
    if (after?.phase === 'act') console.log('STILL ACT after action', st.ep);
    continue;
  }
  await page.waitForTimeout(250);
}
await page.waitForTimeout(3500);
if (!taken.has(4)) await page.screenshot({ path: resolve(outDir, 'atom-forge-3d-final-4.png') });
console.log('DURATION_S', ((Date.now() - t0) / 1000).toFixed(1));
const video = page.video();
await context.close();
await browser.close();
if (video) {
  const raw = await video.path();
  const dest = resolve(outDir, 'atom-forge-3d-final.webm');
  try { renameSync(raw, dest); } catch { copyFileSync(raw, dest); try { unlinkSync(raw); } catch {} }
  console.log('VIDEO', dest);
}