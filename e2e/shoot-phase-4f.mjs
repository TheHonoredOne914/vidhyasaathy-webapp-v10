import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Run against this worktree's backed-up, migrated demo copy and detached servers.
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const origin = process.env.REVIEW_ORIGIN ?? 'http://127.0.0.1:5183';
const output = process.env.REVIEW_SHOTS ?? 'C:/Users/HP/phase-4f-shots';
const db = new Database(resolve('apps/api/data/phase4-qa.db'), { readonly: true });
const profiles = db.prepare("SELECT id, name FROM profile WHERE role = 'student' AND (name LIKE 'Aarav%' OR name LIKE 'Priya%')").all();
db.close();
if (profiles.length !== 2) throw new Error('The two demo profiles are required.');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const rows = [];
try {
  for (const profile of profiles) {
    const context = await browser.newContext({ baseURL: origin });
    try {
      const login = await context.request.post('/api/auth/pin-login', { data: { profileId: profile.id, pin: profile.name.startsWith('Priya') ? '5791' : '2468' }, headers: { origin } });
      if (!login.ok()) throw new Error(`Login failed: ${login.status()}`);
      const page = await context.newPage();
      page.setDefaultTimeout(90_000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const width of [360, 1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        for (const panel of ['ask', 'games']) {
          const ready = page.waitForResponse((response) => response.url().endsWith(panel === 'games' ? '/api/student/games' : '/api/student/home'));
          await page.goto(`/student?panel=${panel}`);
          const response = await ready;
          if (!response.ok()) throw new Error(`${panel}: ${response.status()} ${await response.text()}`);
          await page.getByRole('heading', { name: panel === 'ask' ? 'Ask Saathy' : 'Games', exact: true }).waitFor();
          await page.waitForFunction(() => !document.body.textContent.includes('Opening your game shelf'));
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(500);
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          rows.push({ student: profile.name, panel, width, scrollWidth });
          await page.screenshot({ path: `${output}/${profile.name.split(' ')[0]}-${panel}-${width}.png`, fullPage: true });
          if (scrollWidth > width) throw new Error(`Overflow: ${JSON.stringify(rows.at(-1))}`);
        }
        if (process.env.REVIEW_PAUSE_MS) await page.waitForTimeout(Number(process.env.REVIEW_PAUSE_MS));
      }
      if (errors.length) throw new Error(errors.join('\n'));
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  writeFileSync(`${output}/widths.json`, JSON.stringify(rows, null, 2));
}
console.log(JSON.stringify(rows));
