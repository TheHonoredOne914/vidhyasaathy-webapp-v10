import { chromium } from '@playwright/test';
import Database from 'better-sqlite3';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:5180';
const out = 'e2e/screenshots/polish3b';
const only = process.argv[2];
const db = new Database('apps/api/data/vidhyasaathy.db', { readonly: true });
const browser = await chromium.launch({ headless: true });
await mkdir(out, { recursive: true });
const measurements = [];
async function student(name) {
  const profile = db.prepare("select id from profile where role = 'student' and name = ?").get(name);
  if (!profile) throw new Error(`Missing demo student: ${name}`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: { Origin: base } });
  const login = await context.request.post(`${base}/api/auth/pin-login`, { data: { profileId: profile.id, pin: '2468' } });
  if (!login.ok()) throw new Error(`PIN login: ${login.status()}`);
  return { context, page: await context.newPage() };
}
async function data(context, path) {
  const response = await context.request.get(`${base}/api${path}`);
  if (!response.ok()) throw new Error(`${path}: ${response.status()}`);
  return response.json();
}
async function capture(page, name, widths = [360, 1024, 1280, 1440, 1920], save = [1440]) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(150);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    measurements.push({ screen: name, innerWidth: width, scrollWidth });
    if (save.includes(width)) await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
  }
}
try {
  const { context, page } = await student('Aarav');
  const home = await data(context, '/student/home');
  const subjects = await data(context, '/student/subjects');
  const subject = subjects[0] ?? subjects.subjects?.[0];
  const chapters = subject ? await data(context, `/subjects/${subject.id}/chapters`) : [];
  const chapter = chapters[0] ?? chapters.chapters?.[0];
  if ((!only || only === 'quiz') && chapter) {
    await page.goto(`${base}/student/chapters/${chapter.id}/practice/quick_revision_quiz`);
    await page.locator('.nb-qcard').waitFor();
    await capture(page, 'quiz', undefined, [360, 1440, 1920]);
    const found = new Set();
    const answers = JSON.parse(process.env.POLISH_ANSWERS ?? '[]');
    for (let i = 0; i < 6; i++) {
      const options = page.locator('.nb-opt');
      if (!(await options.count())) break;
      console.log('QUESTION', await page.locator('.qz-question').textContent().catch(() => page.locator('.qz-figure').textContent()), await options.allTextContents());
      await options.nth(answers[i] ?? 0).click();
      await page.getByRole('button', { name: /^Sure\b/ }).click();
      await page.getByRole('button', { name: 'Check answer', exact: true }).click();
      await page.locator('.nb-feedback').waitFor({ timeout: 60000 });
      const state = await page.locator('.nb-feedback--right').count() ? 'quiz-right' : 'quiz-wrong';
      if (!found.has(state)) { await capture(page, state); found.add(state); }
      if (found.size === 2) break;
      await page.getByRole('button', { name: /^(Next question|Finish practice)$/ }).click();
    }
    console.log('FEEDBACK', [...found]);
  }
  for (const [name, path] of [['progress', '/student/progress'], ['homework', '/student?panel=homework'], ['ask', '/student?panel=ask']]) {
    if (only && only !== name) continue;
    await page.goto(`${base}${path}`);
    if (name === 'progress') {
      await page.locator('.pr-ring').first().waitFor();
      await page.locator('.cal .d').first().waitFor();
    } else if (name === 'homework') {
      await page.locator('.pg-homework .hw').first().waitFor();
      await page.locator('.ws .wq').waitFor();
    } else {
      await page.locator('.ask-select select').last().waitFor();
      await page.getByRole('textbox', { name: 'Your doubt' }).fill(`Help me understand ${chapter.title}.`);
      await page.getByRole('button', { name: 'Send', exact: true }).click();
      await page.getByTestId('ai-state').first().waitFor();
      if (await page.getByTestId('ai-state').textContent().then((text) => text.includes('AI not configured'))) throw new Error('Raw AI configuration error is visible');
    }
    await capture(page, name, undefined, name === 'progress' ? [360, 1440, 1920] : [1440]);
  }
  if (!only || only === 'homework') {
    const homework = await data(context, '/student/homework?tab=all');
    const sheet = homework.items.find((row) => row.status === 'todo' || row.status === 'overdue') ?? homework.items[0];
    if (!sheet) throw new Error('No real worksheet to verify');
    await page.goto(`${base}/student/assignments/${sheet.id}`);
    await page.locator('.ws .wq').waitFor();
    await capture(page, 'worksheet');
    for (let i = 0; i < sheet.count && !(await page.getByRole('button', { name: 'Save draft', exact: true }).count()); i++) {
      const next = page.getByRole('button', { name: 'Next question', exact: true });
      if (await next.isDisabled()) break;
      await next.click();
    }
    if (await page.getByRole('button', { name: 'Save draft', exact: true }).count()) {
      const options = page.locator('.ws-option');
      if (await options.count()) await options.first().click();
      else await page.locator('.ws textarea.ans').first().fill('I will show my working step by step.');
      const draft = page.waitForResponse((response) => response.url().includes(`/student/homework/${sheet.id}/draft`) && response.request().method() === 'PUT');
      await page.getByRole('button', { name: 'Save draft', exact: true }).click();
      const saved = await draft;
      if (!saved.ok()) throw new Error(`Draft save: ${saved.status()}`);
      const attempt = page.waitForResponse((response) => response.url().endsWith('/api/attempts') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Submit answer', exact: true }).click();
      const submitted = await attempt;
      if (!submitted.ok()) throw new Error(`Worksheet submit: ${submitted.status()}`);
      console.log('WORKSHEET draft PUT and evidence POST passed');
    } else console.log('WORKSHEET has no unanswered items; existing work kept');
  }
  if (!only || only === 'progress') {
    const second = await student('Priya');
    await second.page.goto(`${base}/student/progress`);
    await second.page.locator('.pr-ring').first().waitFor();
    await second.page.locator('.cal .d').first().waitFor();
    await capture(second.page, 'progress-priya', [1440]);
    await second.context.close();
  }
  console.log(JSON.stringify({ student: home.greeting.name, measurements, overflow: measurements.filter((row) => row.scrollWidth > row.innerWidth) }));
  if (measurements.some((row) => row.scrollWidth > row.innerWidth)) process.exitCode = 1;
  await context.close();
} finally { db.close(); await browser.close(); }
