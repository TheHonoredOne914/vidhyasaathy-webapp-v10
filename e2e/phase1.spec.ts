import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { PAGE } from '../apps/web/src/pages.ts';
import { registerSchool } from './registerSchool.ts';
import { seedClaim, seedRoleSession } from './seed.ts';
import { baseURL, databasePath, ensureServers, stopServers } from './server.ts';

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => { errors.push(error.message); });
    await use();
    expect(errors.filter((error) => !isExpectedConsoleNoise(error))).toEqual([]);
  }, { auto: true }],
});

function isExpectedConsoleNoise(error: string): boolean {
  return error.includes('net::ERR_') || error.includes('status of 401');
}

const widths = [360, 768, 1024, 1280] as const;
const publicKeys = ['landing', 'signIn', 'pin', 'claim', 'register', 'recover', 'privacy', 'onboarding', 'acceptInvite', 'accessDenied', 'notFound'] as const;

test.describe.configure({ mode: 'serial', timeout: 180000 });
test.use({ baseURL });

test.beforeAll(async () => {
  mkdirSync('e2e/screenshots', { recursive: true });
  await ensureServers();
});

test.afterAll(async () => {
  await stopServers();
});

async function expectNoOverflow(page: Page): Promise<void> {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(extra).toBeLessThanOrEqual(0);
}

async function expectAxe(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

test('public routes have titles, no overflow, and no axe violations', async ({ page }) => {
  test.slow();
  for (const key of publicKeys) {
    const route = PAGE[key];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route.path);
      await expect(page).toHaveTitle(route.title);
      if (route.path !== '/signin') {
        await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Sign in' })).toBeVisible();
      }
      await expectNoOverflow(page);
      if (route.path === '/' && width === 1280) {
        const copy = await page.locator('.hero-copy').boundingBox();
        const visual = await page.locator('.hero-visual').boundingBox();
        expect(copy).not.toBeNull();
        expect(visual).not.toBeNull();
        expect(copy!.width).toBeGreaterThan(500);
        expect(copy!.x + copy!.width).toBeLessThanOrEqual(visual!.x + 1);
        expect(Math.abs(copy!.y + copy!.height / 2 - visual!.y - visual!.height / 2)).toBeLessThan(2);
      }
      if (width === 1280) await expectAxe(page);
      if ((width === 360 || width === 1280) && (route.path === '/' || route.path === '/signin' || route.path === '/register-school')) {
        const name = route.path === '/' ? 'landing' : route.path === '/signin' ? 'signin' : 'register';
        await page.screenshot({ path: `e2e/screenshots/${name}-${width}.png`, fullPage: true });
      }
    }
  }
});

test('register reaches setup and a student cannot open administrator screens', async ({ page }) => {
  const email = `admin-${Date.now()}@example.test`;
  await page.setViewportSize({ width: 1280, height: 800 });
  await registerSchool(page, 'North Ridge School', email);
  await expect(page.getByRole('heading', { level: 1, name: 'School setup' })).toBeVisible();
  await expect(page).toHaveTitle(PAGE.setup.title);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'North Ridge School' })).toBeVisible();
  await expect(page.getByText('signed in as the administrator')).toBeVisible();
  await expect(page).toHaveTitle(PAGE.admin.title);
  await expectAxe(page);

  const dialog = page.getByRole('dialog', { name: 'Sign out?' });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(dialog.getByRole('button', { name: 'Confirm sign out' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Stay signed in' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Confirm sign out' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeFocused();

  await page.screenshot({ path: 'e2e/screenshots/admin-1280.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await expectNoOverflow(page);
  await page.screenshot({ path: 'e2e/screenshots/admin-360.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });

  const abortApi = (url: URL) => url.pathname.startsWith('/api/');
  await page.route(abortApi, (route) => route.abort());
  await page.reload();
  await expect(page.getByTestId('updated-at')).toContainText('Updated at');
  await expect(page.getByRole('heading', { level: 1, name: 'North Ridge School' })).toBeVisible();
  await page.unroute(abortApi);

  const me = await page.evaluate(async () => {
    const response = await fetch('/api/me', { credentials: 'include' });
    return response.json() as Promise<{ school: { id: string } }>;
  });
  const student = seedClaim(databasePath, me.school.id, 'E2E student');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Confirm sign out' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/claim');
  await page.getByLabel('Activation code').fill(student.code);
  await page.getByLabel('PIN').fill('2468');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Let’s learn!' })).toBeVisible();
  await page.getByRole('link', { name: 'Start learning' }).click();
  await page.goto('/student');
  await expect(page.getByText(student.profileId)).toHaveCount(0);
  await expect(page).toHaveTitle(PAGE.student.title);
  await page.screenshot({ path: 'e2e/screenshots/student-1280.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await expectNoOverflow(page);
  await page.screenshot({ path: 'e2e/screenshots/student-360.png', fullPage: true });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin');
  await expect(page).toHaveURL('/access-denied');
  await expect(page.getByRole('heading', { level: 1, name: 'This page isn’t available for this account.' })).toBeVisible();
  await expect(page).toHaveTitle(PAGE.accessDenied.title);
  await expectAxe(page);
  await page.screenshot({ path: 'e2e/screenshots/access-denied-1280.png', fullPage: true });

  await page.getByRole('link', { name: 'Go home' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Confirm sign out' }).click();
  await page.goto('/signin/student');
  await page.getByRole('button', { name: 'E2E student' }).click();
  await expect(page.getByText(student.profileId)).toHaveCount(0);
  await page.getByLabel('PIN').fill('2468');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/student');
  await expect(page.getByText(student.profileId)).toHaveCount(0);

  for (const role of ['teacher', 'parent'] as const) {
    const token = seedRoleSession(databasePath, me.school.id, role, `E2E ${role}`);
    const context = await page.context().browser()!.newContext({ baseURL });
    const errors: string[] = [];
    context.on('page', (next) => {
      next.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      next.on('pageerror', (error) => { errors.push(error.message); });
    });
    await context.addCookies([{ name: 'vidhyasaathy_session', value: token, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
    const rolePage = await context.newPage();
    for (const width of widths) {
      await rolePage.setViewportSize({ width, height: 800 });
      await rolePage.goto(`/${role}`);
      if (role === 'teacher') await expect(rolePage.getByText('signed in as the teacher')).toBeVisible();
      else await expect(rolePage.getByRole('heading', { level: 1, name: 'Hello, E2E parent' })).toBeVisible();
      await expectNoOverflow(rolePage);
      if (width === 1280) {
        await expect(rolePage).toHaveTitle(PAGE[role].title);
        await expectAxe(rolePage);
      }
    }
    await context.close();
    expect(errors.filter((error) => !isExpectedConsoleNoise(error))).toEqual([]);
  }
});
