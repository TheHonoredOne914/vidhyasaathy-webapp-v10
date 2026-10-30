import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const Sqlite = require('better-sqlite3');
const baseURL = 'http://127.0.0.1:5181';
const [screen = 'games', person = 'Aarav'] = process.argv.slice(2);
const routes = {
  games: '/student?panel=games', notifications: '/student/notifications', settings: '/student/settings',
  'teacher-home': '/teacher', 'parent-home': '/parent',
  'signin-student': '/signin/student', 'signin-teacher': '/signin?role=teacher', 'signin-parent': '/signin?role=parent',
};
if (!routes[screen]) throw new Error(`Unknown screen: ${screen}`);
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
  if (!screen.startsWith('signin-')) {
    let body;
    let path = '/auth/login';
    if (screen === 'teacher-home' || screen === 'parent-home') {
      body = { email: `${screen === 'teacher-home' ? 'teacher' : 'parent'}@demo.invalid`, password: 'Saathy@2026!' };
    } else {
      const db = new Sqlite(new URL('../apps/api/data/vidhyasaathy.db', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), { readonly: true });
      const profile = db.prepare('SELECT id FROM profile WHERE role = ? AND name = ?').get('student', person);
      db.close();
      if (!profile) throw new Error(`No student named ${person}`);
      path = '/auth/pin-login';
      const pins = { Aarav: '2468', Priya: '5791' };
      if (!pins[person]) throw new Error('Use Aarav or Priya for the screenshot comparison.');
      body = { profileId: profile.id, pin: pins[person] };
    }
    const response = await context.request.post(`/api${path}`, { data: body, headers: { origin: baseURL } });
    if (!response.ok()) throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => { pageErrors.push(error.message); });
  await mkdir(new URL('./screenshots/polish3c/', import.meta.url), { recursive: true });
  for (const width of [360, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto(routes[screen]);
    await page.waitForLoadState('networkidle');
    await page.locator('.nb-skel').waitFor({ state: 'detached' });
    await page.evaluate(() => document.fonts.ready);
    if (pageErrors.length) throw new Error(pageErrors.join('\n'));
    const measurement = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    if (measurement.scrollWidth > measurement.width) throw new Error(`${screen} overflow: ${JSON.stringify(measurement)}`);
    console.log(`${screen}/${person}: ${measurement.width}/${measurement.scrollWidth}`);
    if ([360, 1440, 1920].includes(width)) {
      const suffix = person === 'Aarav' ? '' : `-${person.toLowerCase()}`;
      await page.screenshot({ path: new URL(`./screenshots/polish3c/${screen}${suffix}-${width}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    }
  }
  if (screen === 'settings' && process.argv.includes('--verify')) {
    for (const [name, attribute] of [['Bigger text', 'biggerText'], ['Plain font for notes', 'plainFont']]) {
      const toggle = page.getByRole('switch', { name, exact: true });
      const original = await toggle.getAttribute('aria-checked');
      for (let index = 0; index < 2; index++) {
        await toggle.click();
        await page.reload();
        await toggle.waitFor();
        const expected = index === 0 ? String(original !== 'true') : original;
        if (await page.evaluate((key) => document.documentElement.dataset[key], attribute) !== expected) throw new Error(`${name} did not survive reload.`);
        await page.setViewportSize({ width: 360, height: 1080 });
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${name} causes mobile overflow.`);
      }
    }
    const toggle = page.getByRole('switch', { name: 'Reduce motion', exact: true });
    const original = await toggle.getAttribute('aria-checked');
    for (let index = 0; index < 2; index++) {
      const saved = page.waitForResponse((response) => response.url().endsWith('/api/notification-settings') && response.request().method() === 'PUT');
      await toggle.click();
      if (!(await saved).ok()) throw new Error('Reduce motion save failed.');
      await page.reload();
      await toggle.waitFor();
      const expected = index === 0 ? original !== 'true' : original === 'true';
      if (await page.evaluate(() => document.documentElement.hasAttribute('data-reduce-motion')) !== expected) throw new Error('Reduce motion attribute did not survive reload.');
    }
    console.log('settings: browser preferences and server reduce-motion round-trips restored; 360px fits');
  }
  if (screen === 'notifications' && process.argv.includes('--verify')) {
    const toggle = page.getByRole('switch', { name: 'New games', exact: true });
    const original = await toggle.getAttribute('aria-checked');
    for (let index = 0; index < 2; index++) {
      const saved = page.waitForResponse((response) => response.url().endsWith('/api/notification-settings') && response.request().method() === 'PUT');
      await toggle.click();
      const response = await saved;
      if (!response.ok()) throw new Error(`Preference save failed: ${response.status()}`);
      await page.reload();
      await page.getByRole('switch', { name: 'New games', exact: true }).waitFor();
      const value = await page.getByRole('switch', { name: 'New games', exact: true }).getAttribute('aria-checked');
      if (value !== (index === 0 ? String(original !== 'true') : original)) throw new Error('Preference did not survive reload.');
    }
    const markAll = page.getByRole('button', { name: 'Mark all read' });
    if (await markAll.isEnabled()) {
      const marked = page.waitForResponse((response) => response.url().endsWith('/api/notifications/read-all'));
      await markAll.click();
      if (!(await marked).ok()) throw new Error('Mark all read failed.');
      await page.reload();
      await page.getByText("You're all caught up.", { exact: true }).waitFor();
    }
    console.log('notifications: preference round-trip restored; mark-all read persisted');
  }
} finally {
  await browser.close();
}
