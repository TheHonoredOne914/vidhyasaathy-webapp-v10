import { chromium, expect as baseExpect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
// Run from the repository root against the web dev/preview server. API calls
// are stubbed: these checks exercise fictional dashboards, never school data.
const url = (process.env.DEMO_URL ?? 'http://127.0.0.1:5373').replace(/\/$/, '');
await mkdir('test-results', { recursive: true });
const expect = baseExpect.configure({ timeout: 30000 });
const browser = await chromium.launch({ channel: process.env.DEMO_BROWSER_CHANNEL ?? 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(`${url}/api/**`, route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthenticated', message: 'Sign in.' }) }));
try {
  await page.goto(`${url}/demo/parent`);
  await expect(page.getByRole('heading', { name: 'Small steps. A clearer picture.' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('unrelated-record', 'keep-me'));
  await page.getByRole('button', { name: /Priya/ }).click();
  await page.getByLabel('Time window').selectOption('14');
  await page.getByLabel('Subject').selectOption('maths');
  await expect(page.getByText('Daily activity for Priya · last 14 days')).toBeVisible();
  await page.getByLabel('Subject').selectOption('all');
  await page.locator('.demo-record').first().click();
  await expect(page.getByRole('region', { name: 'Activity details' })).toBeVisible();
  await page.getByRole('button', { name: 'Close activity details' }).click();
  await page.screenshot({ path: 'test-results/demo-parent.jpg', fullPage: true, type: 'jpeg', quality: 70 });

  await page.getByRole('link', { name: 'Teacher desk' }).click();
  await page.getByLabel('Your class').selectOption('class-9b');
  await page.getByRole('button', { name: 'Create assignment' }).click();
  await page.getByLabel('Assignment title').fill('Shared practice smoke check');
  await page.getByRole('button', { name: 'Save sample assignment' }).click();
  await expect(page.getByText('Shared practice smoke check', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Open Priya/ }).click();
  await expect(page.getByRole('heading', { name: "Priya's learning story" })).toBeVisible();
  await page.getByRole('button', { name: 'Weekly reports' }).click();
  await expect(page.getByRole('heading', { name: 'Weekly class report' })).toBeVisible();
  await page.getByRole('button', { name: /Speed and velocity/ }).click();
  await expect(page.getByRole('button', { name: /Open Priya/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Kabir/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear concept filter' }).click();
  await page.screenshot({ path: 'test-results/demo-teacher.jpg', fullPage: true, type: 'jpeg', quality: 70 });
  await page.getByRole('link', { name: 'Parent notebook' }).click();
  await page.getByRole('button', { name: /Priya/ }).click();
  await expect(page.getByText('Shared practice smoke check', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Priya/ }).click();
  await expect(page.getByText('Shared practice smoke check', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'School office' }).click();
  for (const [tab, single] of [['Classes','class'], ['Teachers','teacher'], ['Students','student'], ['Subjects','subject']]) {
    await page.getByRole('button', { name: new RegExp(`^${tab} `) }).click();
    await page.getByRole('button', { name: `Add ${single}`, exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill(`Sample ${single}`);
    await page.getByRole('button', { name: 'Save sample record' }).click();
    await expect(page.getByRole('rowheader', { name: `Sample ${single}`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Edit Sample ${single}`, exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill(`Edited ${single}`);
    await page.getByRole('button', { name: 'Save sample record' }).click();
    await expect(page.getByRole('rowheader', { name: `Edited ${single}`, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: /^Students / }).click();
  await page.getByRole('textbox', { name: 'Search students' }).fill('nothing-matches');
  await expect(page.getByText('No records match these filters.', { exact: false })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search students' }).fill('');
  await page.getByLabel('Class filter').selectOption('class-9b');
  await expect(page.getByRole('rowheader', { name: 'Priya', exact: true })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Aarav', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Teacher desk' }).click();
  await page.getByRole('textbox', { name: 'Search students' }).fill('Edited student');
  await expect(page.getByRole('rowheader', { name: 'Edited student', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'School office' }).click();
  await page.getByRole('button', { name: /^Classes / }).click();
  await page.getByRole('button', { name: 'Add class', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Class 9 · A');
  await page.getByRole('button', { name: 'Save sample record' }).click();
  await expect(page.getByRole('alert')).toContainText('already exists');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/demo-admin.jpg', fullPage: true, type: 'jpeg', quality: 70 });

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('button', { name: 'Restore sample' }).click();
  await expect(page.getByRole('rowheader', { name: 'Edited class', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-record'))).toBe('keep-me');
  const accessibility = [];
  for (const role of ['parent','teacher','admin']) {
    await page.goto(`${url}/demo/${role}`);
    if (role === 'teacher') await page.getByRole('button', { name: 'Weekly reports' }).click();
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
    accessibility.push({ role, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })) });
    await page.setViewportSize({ width: 390, height: 844 });
    if (role === 'teacher') await page.getByRole('button', { name: 'Class notebook' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/demo-${role}-mobile.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(`${url}/signin`);
  await expect(page.getByRole('button', { name: 'Enter as Student', exact: true })).toBeVisible();
  for (const role of ['Teacher','Parent','Admin']) await expect(page.getByRole('link', { name: `Enter as ${role}`, exact: true })).toBeVisible();
  console.log(JSON.stringify({ result: 'PASS: shared assignments, persistence, four add/edit forms, filters, Radar, details, reset, sign-in entries and mobile overflow', errors, accessibility }, null, 2));
  expect(errors).toEqual([]);
  expect(accessibility.every(row => row.violations.length === 0)).toBe(true);
} catch (error) { console.log(JSON.stringify({ url: page.url(), body: await page.locator("body").innerText(), errors }, null, 2)); throw error; } finally { await browser.close(); }
