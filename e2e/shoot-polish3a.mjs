import { chromium } from 'playwright';
import { DatabaseSync } from 'node:sqlite';
import { mkdir } from 'node:fs/promises';

const api = 'http://127.0.0.1:3007';
const web = 'http://127.0.0.1:5179';
const folder = 'e2e/screenshots/polish3a';
await mkdir(folder, { recursive: true });
const db = new DatabaseSync('apps/api/data/vidhyasaathy.db', { readOnly: true });
const students = db.prepare("SELECT id,name FROM profile WHERE role = 'student'").all();
db.close();
const browser = await chromium.launch();
try {
  for (const name of ['Aarav', 'Priya']) {
    const student = students.find((row) => row.name === name);
    if (!student) throw new Error(`Missing demo student ${name}`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce', extraHTTPHeaders: { Origin: web } });
    const login = await context.request.post(`${api}/auth/pin-login`, { data: { profileId: student.id, pin: name === 'Priya' ? '5791' : '2468' } });
    if (!login.ok()) throw new Error(`PIN login ${name}: ${login.status()} ${await login.text()}`);
    async function get(path) {
      const res = await context.request.get(`${api}${path}`);
      if (!res.ok()) throw new Error(`${path}: ${res.status()} ${await res.text()}`);
      return res.json();
    }
    const subjects = await get('/student/subjects');
    const subject = subjects.find((row) => /science/i.test(row.name)) ?? subjects[0];
    const chapters = await get(`/subjects/${subject.id}/chapters`);
    const chapter = chapters.find((row) => /motion/i.test(row.title)) ?? chapters[0];
    const concepts = await get(`/chapters/${chapter.id}/concepts`);
    const concept = concepts.find((row) => /distance.*displacement/i.test(row.title)) ?? concepts[0];
    const sessions = await get(`/chapters/${chapter.id}/sessions`);
    if (process.env.DISCOVER) {
      console.log(JSON.stringify({ name, subject, chapter, concepts: concepts.map(({ id, title }) => ({ id, title })), sessions, diagnostic: await get(`/chapters/${chapter.id}/diagnostic`) }));
      await context.close();
      continue;
    }
    const routes = {
      home: '/student', subjects: '/student?panel=subjects', 'subject-path': `/student/subjects/${subject.id}`,
      lesson: `/student/chapters/${chapter.id}/concepts/${concept.id}`, diagnostic: `/student/chapters/${chapter.id}/diagnostic`,
      'session-player': sessions[0] ? `/student/sessions/${sessions[0].id}` : null,
    };
    const page = await context.newPage();
    page.on('pageerror', (error) => { console.error(`PAGE ERROR: ${error.message}`); process.exitCode = 1; });
    for (const [screen, route] of Object.entries(routes)) {
      if (process.env.SCREEN && process.env.SCREEN !== screen) continue;
      if (name === 'Priya' && screen !== 'home') continue;
      if (!route) throw new Error(`No real content for ${screen}`);
      await page.goto(`${web}${route}`);
      await page.waitForLoadState('networkidle');
      await page.locator('.nb-sheet .nb-skel').waitFor({ state: 'hidden' });
      if (process.env.INSPECT) console.log(JSON.stringify(await page.locator('.ls-page').evaluate((element) => {
        const chain = [];
        for (let node = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          chain.push({ class: node.className, background: style.background, height: node.clientHeight, scroll: node.scrollHeight });
        }
        return chain;
      })));
      if (await page.locator('.nb-sheet [role="alert"]').count()) throw new Error(`${name} ${screen}: ${await page.locator('.nb-sheet [role="alert"]').allTextContents()}`);
      if (!await page.locator('.nb-sheet h1').count()) throw new Error(`${name} ${screen}: no populated page heading`);
      for (const width of name === 'Priya' ? [1440] : [360, 1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1080 });
        await page.evaluate(() => document.fonts.ready);
        const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        console.log(`${name} ${screen} ${width}: ${dimensions.scroll}/${dimensions.viewport}`);
        if (dimensions.scroll > dimensions.viewport) throw new Error(`${name} ${screen} overflows at ${width}`);
        if ([360, 1440, 1920].includes(width)) await page.screenshot({ path: `${folder}/${screen}${name === 'Priya' ? '-priya' : ''}-${width}.png`, fullPage: true });
      }
      if (process.env.SMOKE && name === 'Aarav') {
        await page.setViewportSize({ width: 1440, height: 1080 });
        if (screen === 'lesson') {
          for (const [tab, heading] of [['Story', 'Follow the idea'], ['Diagram', 'Try it for yourself'], ['Exam style', 'Write it clearly']]) {
            await page.getByRole('tab', { name: tab, exact: true }).click();
            await page.getByRole('heading', { name: heading, exact: true }).waitFor();
          }
          await page.getByRole('tab', { name: 'Notes', exact: true }).click();
          const check = page.locator('.ls-check').first();
          await check.locator('.opts button').first().click();
          await check.getByRole('button', { name: /^Sure/ }).click();
          const checked = page.waitForResponse((response) => response.url().endsWith('/lesson/checkpoint') && response.request().method() === 'POST');
          await check.getByRole('button', { name: 'Check', exact: true }).click();
          if (!(await checked).ok()) throw new Error('Lesson checkpoint failed');
          await check.getByRole('status').waitFor();
          const simplified = page.waitForResponse((response) => response.url().includes('/lesson?simpler=1'));
          await page.getByRole('button', { name: 'Explain simpler', exact: true }).first().click();
          if (!(await simplified).ok()) throw new Error('Simpler lesson failed');
          console.log('SMOKE lesson: style tabs, server checkpoint and simpler lesson passed');
        }
        if (screen === 'diagnostic') {
          const notTaught = () => page.getByRole('button', { name: /I haven't learned this yet/ });
          await notTaught().click();
          if (await page.locator('.nb-conf').count()) throw new Error('Not-taught answer still asks for confidence');
          await page.getByRole('button', { name: 'Next', exact: true }).click();
          await page.getByRole('button', { name: 'Back', exact: true }).click();
          if (await notTaught().getAttribute('aria-pressed') !== 'true') throw new Error('Diagnostic back lost answer');
          let submitted;
          const endpoint = `**/chapters/${chapter.id}/diagnostic`;
          await page.route(endpoint, async (route) => {
            if (route.request().method() !== 'POST') return route.continue();
            submitted = route.request().postDataJSON();
            await route.abort('failed');
          });
          while (await page.getByRole('button', { name: 'Next', exact: true }).count()) {
            await notTaught().click();
            await page.getByRole('button', { name: 'Next', exact: true }).click();
          }
          await notTaught().click();
          await page.getByRole('button', { name: 'Finish', exact: true }).click();
          await page.locator('.nb-sheet [role="alert"]').waitFor();
          if (!submitted?.answers.length || submitted.answers.some((answer) => answer.answer !== 'not_taught' || !Number.isFinite(answer.timeMs))) throw new Error('Diagnostic not-taught payload invalid');
          await page.unroute(endpoint);
          console.log('SMOKE diagnostic: skip confidence, back, not_taught payload and retryable network failure passed (submission intentionally aborted; no diagnostic evidence changed)');
        }
        if (screen === 'session-player') {
          const note = page.getByRole('textbox', { name: 'Your note', exact: true });
          const previous = await note.inputValue();
          await note.fill('A note saved only for this verification.');
          await page.reload();
          await note.waitFor();
          if (await note.inputValue() !== 'A note saved only for this verification.') throw new Error('Slide note did not persist');
          await note.fill(previous);
          const next = page.locator('.ctrl').getByRole('button', { name: /^Next/ });
          if (await next.count()) {
            const advanced = page.waitForResponse((response) => response.url().endsWith('/advance') && response.request().method() === 'POST');
            await next.click();
            if (!(await advanced).ok()) throw new Error('Session advance failed');
            await page.getByText('Slide 2 of', { exact: false }).waitFor();
            await page.locator('.ctrl').getByRole('button', { name: /Back/ }).click();
            await page.getByText('Slide 1 of', { exact: false }).waitFor();
          }
          console.log('SMOKE session: per-slide device note and server-gated forward/back passed');
        }
      }
    }
    await context.close();
  }
} finally { await browser.close(); }
