// Records a paced demo walkthrough of VidhyaSaathy (1280x720 webm, video only), v2:
// adds the Motion chapter, learning path, session slides, an Ask Saathy answer and the teacher login.
// Usage: node scripts/record-walkthrough.mjs [--dry] [--pin]
//   --dry  no video, frames only (rehearsal)
//   --pin  skip the activation-code flow and use the profile picker + PIN
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';

const BASE = process.env.WALK_BASE ?? 'http://127.0.0.1:5173';
const API = `${BASE}/api`;
const DRY = process.argv.includes('--dry');
const FORCE_PIN = process.argv.includes('--pin') || DRY;
const OUT = resolve('e2e/screenshots/walkthrough');
const VIDEO_DIR = join(OUT, 'raw');
const PIN = '2468';
const TEACHER_EMAIL = 'teacher@demo.invalid';
const TEACHER_PASSWORD = 'Saathy@2026!';
const TEACHER_PIN = '1357';
mkdirSync(OUT, { recursive: true });
if (!DRY) { rmSync(VIDEO_DIR, { recursive: true, force: true }); mkdirSync(VIDEO_DIR, { recursive: true }); }

const started = Date.now();
const log = [];
const skipped = [];
const stamp = () => { const s = Math.round((Date.now() - started) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const note = (msg) => { const line = `[${stamp()}] ${msg}`; log.push(line); console.log(line); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Visible cursor + click ripple, drawn inside the page so it lands in the video.
const CURSOR = () => {
  const install = () => {
    if (document.getElementById('__walk_cursor')) return;
    const style = document.createElement('style');
    style.textContent = `#__walk_cursor{position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-3px,-2px);transition:transform .05s}
#__walk_cursor svg{filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}
.__walk_ripple{position:fixed;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid rgba(217,83,79,.85);z-index:2147483646;pointer-events:none;animation:__walk_r .55s ease-out forwards}
@keyframes __walk_r{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}`;
    document.head.appendChild(style);
    const c = document.createElement('div');
    c.id = '__walk_cursor';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M2 1 L2 18 L6.5 13.8 L9.6 20.5 L12.4 19.2 L9.3 12.6 L15.5 12.6 Z" fill="#fff" stroke="#041d3d" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    const last = window.__walkPos ?? { x: 640, y: 360 };
    c.style.left = `${last.x}px`; c.style.top = `${last.y}px`;
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => { window.__walkPos = { x: e.clientX, y: e.clientY }; c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`; }, true);
    addEventListener('mousedown', (e) => { const r = document.createElement('div'); r.className = '__walk_ripple'; r.style.left = `${e.clientX}px`; r.style.top = `${e.clientY}px`; document.body.appendChild(r); setTimeout(() => r.remove(), 600); c.style.transform = 'translate(-3px,-2px) scale(.85)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = 'translate(-3px,-2px)'; }, true);
  };
  if (document.body) install(); else addEventListener('DOMContentLoaded', install);
};

let page;
let mouse = { x: 640, y: 360 };
let frameNo = 0;

async function frame(name) {
  frameNo += 1;
  const file = join(OUT, `${String(frameNo).padStart(2, '0')}-${name}.png`);
  try { await page.screenshot({ path: file }); } catch {}
  const errorText = await page.locator('[role="alert"]').allInnerTexts().catch(() => []);
  if (errorText.length) note(`  alert on ${name}: ${errorText.join(' | ').slice(0, 200)}`);
}

async function glide(x, y, steps = 28) {
  const from = { ...mouse };
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps; const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await wait(14);
  }
  mouse = { x, y };
}

async function point(locator, { pause = 450 } = {}) {
  const target = locator.first();
  await target.scrollIntoViewIfNeeded({ timeout: 8000 });
  await wait(250);
  const box = await target.boundingBox();
  if (!box) throw new Error('no box');
  await glide(box.x + Math.min(box.width / 2, 120), box.y + box.height / 2);
  await wait(pause);
}

async function click(locator, opts = {}) {
  await point(locator, opts);
  await page.mouse.down(); await wait(90); await page.mouse.up();
  await wait(opts.after ?? 900);
}

async function type(locator, text) {
  await click(locator, { after: 250 });
  await page.keyboard.type(text, { delay: 85 });
  await wait(400);
}

async function scrollTour({ max = 3200, back = true } = {}) {
  await glide(820, 420, 18);
  let moved = 0;
  for (;;) {
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 90); await wait(70);
    const after = await page.evaluate(() => scrollY);
    moved += after - before;
    if (after === before || moved > max) break;
  }
  await wait(900);
  if (back) { await page.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' })); await wait(1300); }
}

async function settle(ms = 1500) {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForFunction(() => !/^\s*Loading/m.test(document.querySelector('main')?.innerText ?? ''), null, { timeout: 10000 }).catch(() => {});
  await page.evaluate(CURSOR).catch(() => {});
  await wait(ms);
}

async function step(name, fn) {
  note(`> ${name}`);
  try { await fn(); } catch (error) { skipped.push(`${name}: ${String(error.message ?? error).split('\n')[0].slice(0, 160)}`); note(`  SKIPPED ${name}: ${String(error.message ?? error).split('\n')[0].slice(0, 160)}`); }
}

const nav = (label) => page.getByRole('link', { name: label, exact: true });

async function signOut() {
  await click(page.getByRole('button', { name: 'Sign out', exact: true }));
  await click(page.getByRole('button', { name: 'Confirm sign out' }), { after: 1500 });
  await page.waitForURL((u) => !/\/(student|teacher|parent)/.test(u.pathname), { timeout: 15000 });
  await settle(800);
}

// ---------- preflight (not recorded) ----------
const browser = await chromium.launch({ args: ['--disable-gpu-compositing'] });
const pre = await browser.newContext({ extraHTTPHeaders: { origin: new URL(BASE).origin } });
const motion = await (async () => {
  const r = await pre.request.post(`${API}/auth/login`, { data: { email: TEACHER_EMAIL, password: TEACHER_PASSWORD } });
  return { teacherPassword: r.ok() ? TEACHER_PASSWORD : null, teacherStatus: String(r.status()) };
})();
const lookup = await pre.request.post(`${API}/auth/student/lookup`, { data: { slug: 'Demo school', rollNo: '1' } });
const lookupBody = lookup.ok() ? await lookup.json() : null;
motion.canActivate = Boolean(lookupBody?.needsActivation);
await pre.close();
note(`preflight student lookup: ${lookup.status()} needsActivation=${motion.canActivate}`);
const db = new Database('apps/api/data/vidhyasaathy-v9b.db', { readonly: true, fileMustExist: true });
const student = db.prepare("SELECT p.id, p.name, s.name AS school FROM profile p JOIN school s ON s.id = p.school_id WHERE p.role = 'student' AND p.name LIKE 'Aarav%' LIMIT 1").get();
db.close();
note(`preflight teacher login: ${motion.teacherPassword ? 'ok' : `failed ${motion.teacherStatus}`}`);

const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  ...(DRY ? {} : { recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } } }),
});
await ctx.addInitScript(CURSOR);
const usePin = FORCE_PIN || !motion.canActivate;
await ctx.addInitScript((st) => { if (!localStorage.getItem('vidhyasaathy.studentProfiles')) localStorage.setItem('vidhyasaathy.studentProfiles', JSON.stringify([st])); }, student);
page = await ctx.newPage();
page.on('pageerror', (e) => note(`  pageerror: ${String(e.message).slice(0, 160)}`));

// 1. Landing
await step('landing', async () => {
  await page.goto(BASE + '/');
  await settle(2500);
  await frame('landing');
  await scrollTour({ max: 4200 });
});

// 2. Student sign-in
let signedIn = false;
await step('student activation sign-in', async () => {
  if (usePin) throw new Error(FORCE_PIN ? 'activation skipped (--pin/--dry)' : 'activation code already used; using PIN');
  await click(page.locator('a.nb-signin'));
  await settle(1000);
  await click(page.locator('.vs-auth-role--student'));
  const codeTab = page.getByRole('button', { name: 'Activation code' });
  if (await codeTab.count()) await click(codeTab);
  await type(page.getByLabel('School', { exact: true }), 'Demo school');
  await type(page.getByLabel('Roll number', { exact: true }), '1');
  await frame('signin-lookup');
  await click(page.getByRole('button', { name: 'Find my account' }), { after: 1500 });
  await page.getByLabel('Activation code', { exact: true }).waitFor({ timeout: 10000 });
  await type(page.getByLabel('Activation code', { exact: true }), 'DEMSTUDENT22');
  await click(page.getByRole('button', { name: 'Continue', exact: true }), { after: 1500 });
  const status = page.getByRole('status').filter({ hasText: 'Dev OTP' });
  await status.waitFor({ timeout: 10000 });
  await point(status, { pause: 900 });
  const otp = ((await status.innerText()).match(/\d{6}/) ?? [])[0];
  await type(page.getByLabel('OTP', { exact: true }), otp);
  await frame('signin-otp');
  await click(page.getByRole('button', { name: 'Continue', exact: true }), { after: 1500 });
  await page.getByLabel('PIN', { exact: true }).waitFor({ timeout: 10000 });
  await type(page.getByLabel('PIN', { exact: true }), PIN);
  await click(page.getByRole('button', { name: 'Save PIN' }), { after: 1500 });
  await page.waitForURL((u) => u.pathname.startsWith('/student'), { timeout: 15000 });
  signedIn = true;
});
if (!signedIn) await step('student PIN sign-in', async () => {
  if (!page.url().includes('/signin')) { await click(page.locator('a.nb-signin')); await settle(1000); }
  await click(page.locator('.vs-auth-role--student'));
  const pinTab = page.getByRole('button', { name: 'Student PIN' });
  if (await pinTab.count()) await click(pinTab);
  await click(page.getByTestId('profile-chooser').getByRole('button', { name: /Aarav/ }));
  await type(page.getByLabel('PIN', { exact: true }), PIN);
  await frame('signin-pin');
  await click(page.getByRole('button', { name: 'Sign in', exact: true }), { after: 1500 });
  await page.waitForURL((u) => u.pathname.startsWith('/student'), { timeout: 15000 });
  signedIn = true;
});
if (!signedIn) throw new Error('could not sign in as the demo student');

// 3. Home
await step('student home', async () => {
  if (!page.url().endsWith('/student')) await page.goto(BASE + '/student');
  await page.getByRole('heading', { level: 1, name: /Namaste/ }).waitFor({ timeout: 15000 });
  await settle(2200);
  await frame('home');
  for (const sel of ['.vs-home-continue', '.vs-home-subjects, [aria-labelledby="home-subjects"]', '.vs-home-week', '.vs-home-game', '.vs-home-goals']) {
    const loc = page.locator(sel);
    if (await loc.count()) await point(loc, { pause: 900 });
  }
  const goal = page.locator('.vs-home-goals button:not([disabled])').filter({ hasText: /Ask Saathy|Practise/ });
  if (await goal.count()) { await click(goal, { after: 1200 }); }
  await frame('home-goal');
  const story = page.getByRole('radio', { name: 'Story' });
  await click(story, { after: 1200 });
  await click(page.getByRole('radio', { name: 'Try it' }), { after: 1000 });
  await click(page.getByRole('radio', { name: 'See it' }), { after: 800 });
  await scrollTour({ max: 1600 });
});

// 4. Subjects -> chapter -> learning path
let chapterUrl = null;
await step('my subjects and chapter', async () => {
  await click(nav('My subjects'), { after: 1500 });
  await settle(1200);
  await frame('subjects');
  await click(page.locator('main').getByRole('link', { name: /Physics/ }), { after: 1500 });
  await settle(1500);
  await frame('subject');
  await scrollTour({ max: 1200 });
  const motionLink = page.locator('main').getByRole('link', { name: /Motion/ });
  await point(motionLink, { pause: 900 });
  chapterUrl = new URL(await motionLink.first().getAttribute('href'), BASE).href;
  await click(motionLink, { after: 1500 });
  await settle(1800);
  await frame('chapter');
});
await step('learning path and notes', async () => {
  const concepts = page.locator('.lesson-card').filter({ has: page.getByRole('heading', { name: 'Concepts' }) });
  await point(concepts, { pause: 2200 });
  await frame('learning-path');
  const notes = page.locator('.lesson-card').filter({ has: page.getByRole('heading', { name: 'Notes' }) });
  await point(notes, { pause: 1800 });
  const sessions = page.locator('.lesson-card').filter({ has: page.getByRole('heading', { name: 'Sessions' }) });
  await point(sessions, { pause: 1400 });
  await frame('chapter-sessions');
});
await step('session player', async () => {
  await click(page.getByRole('list', { name: 'Sessions' }).getByRole('link', { name: /Motion/ }), { after: 1500 });
  await settle(1800);
  await page.getByTestId('current-slide').waitFor({ timeout: 10000 });
  await point(page.getByTestId('current-slide'), { pause: 2200 });
  await frame('slide-1');
  for (let i = 2; i <= 3; i += 1) {
    const next = page.locator('.lesson-actions').getByRole('button', { name: /^(Next|Continue)$/ });
    if (!(await next.count())) break;
    await click(next, { after: 1500 });
    await point(page.getByTestId('current-slide'), { pause: 2000 });
    await frame(`slide-${i}`);
  }
  await click(page.getByRole('link', { name: 'Save and leave' }), { after: 1500 });
  await settle(1000);
});

// 5. Study session
await step('study sessions', async () => {
  await click(nav('Study sessions'), { after: 1500 });
  await settle(1200);
  await frame('sessions');
  await scrollTour({ max: 900 });
});

// 6. Homework, Ask Saathy, progress
await step('homework', async () => {
  await click(nav('Homework'), { after: 1500 });
  await settle(1500);
  await frame('homework');
  await scrollTour({ max: 900 });
});
await step('ask saathy', async () => {
  await click(nav('Ask Saathy'), { after: 1500 });
  await settle(1200);
  const question = page.locator('#ask-question');
  await question.waitFor({ timeout: 8000 });
  const subject = page.locator('#ask-subject');
  if (await subject.count() && !(await subject.inputValue().catch(() => ''))) {
    const opts = await subject.locator('option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
    const labels = await subject.locator('option').evaluateAll((os) => os.filter((o) => o.value).map((o) => ({ v: o.value, t: o.textContent })));
    const pick = labels.find((o) => /Physics|Science/i.test(o.t))?.v ?? opts[0];
    if (pick) { await point(subject); await subject.selectOption(pick); await wait(700); }
  }
  const chapter = page.locator('#ask-chapter');
  if (await chapter.count() && !(await chapter.inputValue().catch(() => ''))) {
    const opts = await chapter.locator('option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
    const labels = await chapter.locator('option').evaluateAll((os) => os.filter((o) => o.value).map((o) => ({ v: o.value, t: o.textContent })));
    const pick = labels.find((o) => /Motion/i.test(o.t))?.v ?? opts[0];
    if (pick) { await point(chapter); await chapter.selectOption(pick); await wait(700); }
  }
  await type(question, 'What is the difference between distance and displacement?');
  await click(page.locator('main, [role="dialog"], aside').getByRole('button', { name: 'Ask Saathy', exact: true }), { after: 1200 });
  await page.waitForFunction(() => !document.body.innerText.includes('Asking'), null, { timeout: 25000 }).catch(() => {});
  await wait(2500);
  await frame('ask');
  await scrollTour({ max: 700, back: false });
  await wait(1500);
  await frame('ask-answer');
});
await step('my progress', async () => {
  await click(nav('My progress'), { after: 1500 });
  await settle(1800);
  await frame('progress');
  await scrollTour({ max: 2400 });
});

// 7. Games list + Atom Forge (kept short to spare the laptop)
await step('games and atom forge', async () => {
  const chapterPath = chapterUrl ? new URL(chapterUrl).pathname : null;
  if (!chapterPath) throw new Error('no chapter url');
  await page.goto(BASE + chapterPath + '/practice');
  await settle(1500);
  await frame('games');
  await scrollTour({ max: 1400, back: false });
  await click(page.getByRole('link', { name: /Atom Builder/ }), { after: 2500 });
  await settle(2500);
  const begin = page.locator('[data-afv-begin]');
  if (await begin.count()) await click(begin, { after: 1500 });
  const until = Date.now() + 12000;
  let shot = false;
  while (Date.now() < until) {
    for (const sel of ['[data-afv-hotspot]', '[data-afv-assist]']) {
      const target = page.locator(sel);
      if (await target.count() && await target.first().isVisible().catch(() => false)) await click(target, { after: 1500 }).catch(() => {});
    }
    if (!shot && Date.now() > until - 7000) { await frame('atom-forge'); shot = true; }
    await wait(1200);
  }
  await page.goBack();
  await settle(1200);
});

// 8. Notifications, settings, privacy
for (const [label, name] of [['Notifications', 'notifications'], ['Settings', 'settings'], ['Privacy', 'privacy']]) {
  await step(label.toLowerCase(), async () => {
    await page.goto(BASE + '/student');
    await settle(600);
    await click(nav(label).first(), { after: 1500 });
    await settle(1500);
    await frame(name);
    await scrollTour({ max: 1800 });
  });
}

// 9. Teacher, then parent
await step('teacher', async () => {
  if (DRY) throw new Error('teacher skipped in --dry so the first-login PIN prompt stays for the real take');
  if (!motion.teacherPassword) throw new Error(`teacher password rejected (${motion.teacherStatus})`);
  await page.goto(BASE + '/student');
  await settle(600);
  await signOut();
  await click(page.locator('a.nb-signin'), { after: 1200 });
  await settle(800);
  await settle(1000);
  await click(page.locator('.vs-auth-role--teacher'));
  await type(page.getByLabel('Email', { exact: true }), TEACHER_EMAIL);
  await type(page.getByLabel('Password', { exact: true }), motion.teacherPassword);
  await click(page.locator('form').getByRole('button', { name: /^Sign in/ }), { after: 2500 });
  const firstPin = page.getByLabel('First-login PIN');
  if (await firstPin.count()) { note(`  teacher first-login PIN prompt: setting PIN ${TEACHER_PIN}`); await type(firstPin, TEACHER_PIN); await frame('teacher-pin'); await click(page.locator('form').getByRole('button', { name: /Set PIN/ }), { after: 2000 }); }
  await page.waitForURL((u) => u.pathname.startsWith('/teacher'), { timeout: 15000 });
  await settle(2000);
  await frame('teacher');
  await scrollTour({ max: 2000 });
  await click(nav('Lessons'), { after: 1500 });
  await settle(1500);
  await frame('teacher-lessons');
  await scrollTour({ max: 900 });
});
await step('parent', async () => {
  if (!(await page.locator('a.nb-signin').count())) { await page.goto(BASE + '/student'); await settle(800); if (/\/(teacher|student)/.test(new URL(page.url()).pathname)) await signOut(); }
  if (await page.locator('a.nb-signin').count()) await click(page.locator('a.nb-signin'), { after: 1200 });
  else await page.goto(BASE + '/signin');
  await settle(1000);
  await click(page.locator('.vs-auth-role--parent'));
  await type(page.getByLabel('Parent phone', { exact: true }), '9876543210');
  await click(page.locator('form').getByRole('button', { name: /Send OTP/ }).first(), { after: 1500 });
  const status = page.getByRole('status').filter({ hasText: 'Dev OTP' });
  await status.waitFor({ timeout: 10000 });
  await point(status, { pause: 800 });
  const otp = ((await status.innerText()).match(/\d{6}/) ?? [])[0];
  await type(page.getByLabel('OTP', { exact: true }), otp);
  await click(page.locator('form').getByRole('button', { name: /^Continue/ }).first(), { after: 2000 });
  await page.waitForURL((u) => u.pathname.startsWith('/parent'), { timeout: 15000 });
  await settle(2000);
  await frame('parent');
  await scrollTour({ max: 1800 });
  const child = page.locator('main a[href*="/parent/children/"]');
  if (await child.count()) { await click(child, { after: 1500 }); await settle(1500); await frame('parent-child'); await scrollTour({ max: 1800, back: false }); }
  await wait(1500);
});

const video = page.video();
await ctx.close();
await browser.close();
if (video) {
  const raw = await video.path();
  renameSync(raw, join(OUT, 'app-walkthrough-v2.webm'));
}
note(`done; skipped: ${skipped.length ? skipped.join(' || ') : 'none'}`);
