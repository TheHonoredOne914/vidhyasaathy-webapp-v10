import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:5187';
const out = 'C:/Users/HP/review-3bc-shots';
const only = process.argv[2];
const routes = {
  progress: '/student/progress', homework: '/student?panel=homework', ask: '/student?panel=ask',
  'teacher-home': '/teacher', 'parent-home': '/parent',
  'signin-student': '/signin/student', 'signin-teacher': '/signin?role=teacher', 'signin-parent': '/signin?role=parent',
};
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const Database = require('better-sqlite3');
const db = new Database('apps/api/data/review-qa.db', { readonly: true });
const browser = await chromium.launch();
const measurements = [];
await mkdir(out, { recursive: true });
try {
  for (const [screen, route] of Object.entries(routes)) {
    if (only && only !== screen) continue;
    const context = await browser.newContext({ baseURL, reducedMotion: 'reduce', extraHTTPHeaders: { Origin: baseURL } });
    context.setDefaultTimeout(180000);
    context.setDefaultNavigationTimeout(180000);
    if (!screen.startsWith('signin-')) {
      const staff = screen === 'teacher-home' || screen === 'parent-home';
      const body = staff ? { email: `${screen === 'teacher-home' ? 'teacher' : 'parent'}@demo.invalid`, password: 'Saathy@2026!' }
        : { profileId: db.prepare("SELECT id FROM profile WHERE role = 'student' AND name LIKE 'Aarav%'").get().id, pin: '2468' };
      const response = await context.request.post(`/api/auth/${staff ? 'login' : 'pin-login'}`, { data: body });
      if (!response.ok()) throw new Error(`${screen} login: ${response.status()} ${await response.text()}`);
    }
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    if (screen === 'homework') {
      const href = await page.getByRole('link', { name: 'Open full worksheet' }).getAttribute('href');
      if (href) routes.worksheet = href;
    }
    for (const width of [390, 1024, 1280, 1600, 1920]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      measurements.push({ screen, ...result });
      if ([390, 1600].includes(width)) await page.screenshot({ path: `${out}/${screen}-${width}.png` });
      if (result.scrollWidth > width) errors.push(`Overflow: ${JSON.stringify(result)}`);
    }
    if (screen === 'homework' && routes.worksheet) {
      await page.goto(routes.worksheet);
      await page.waitForLoadState('networkidle');
      for (const width of [390, 1024, 1280, 1600, 1920]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
        measurements.push({ screen: 'worksheet', ...result });
        if (result.scrollWidth > width) errors.push(`Worksheet overflow: ${JSON.stringify(result)}`);
        if ([390, 1600].includes(width)) await page.screenshot({ path: `${out}/worksheet-${width}.png` });
      }
      await writeFile(`${out}/measurements-worksheet.json`, JSON.stringify({ measurements: measurements.filter((row) => row.screen === 'worksheet'), errors }, null, 2));
    }
    console.log(screen, JSON.stringify(measurements.filter((row) => row.screen === screen)), errors);
    await writeFile(`${out}/measurements-${screen}.json`, JSON.stringify({ measurements: measurements.filter((row) => row.screen === screen), errors }, null, 2));
    await context.close();
    if (errors.length) throw new Error(errors.join('\n'));
  }
} finally {
  db.close();
  await browser.close();
}
