import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { PAGE } from '../apps/web/src/pages.ts';
import { registerSchool } from './registerSchool.ts';
import { baseURL, ensureServers, stopServers } from './server.ts';

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => { errors.push(error.message); });
    await use();
    expect(errors.filter((error) => !error.includes('net::ERR_') && !error.includes('status of 401'))).toEqual([]);
  }, { auto: true }],
});

test.describe.configure({ mode: 'serial', timeout: 180000 });
test.use({ baseURL });

test.beforeAll(async () => {
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

test('wizard invites a teacher and shows bad roster rows', async ({ page, browser }) => {
  const adminEmail = `admin-${Date.now()}@example.test`;
  const teacherEmail = `teacher-${Date.now()}@example.test`;
  await page.setViewportSize({ width: 1280, height: 900 });
  await registerSchool(page, 'West Lake School', adminEmail);
  await expect(page.getByRole('heading', { level: 1, name: 'School setup' })).toBeVisible();
  await expect(page.getByTestId('school-name')).toHaveText('West Lake School');
  await expect(page).toHaveTitle(PAGE.setup.title);
  await expectAxe(page);
  await page.screenshot({ path: 'e2e/screenshots/wizard-1280.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await expectNoOverflow(page);
  await page.screenshot({ path: 'e2e/screenshots/wizard-360.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name').fill('2026-27');
  await page.getByLabel('Starts on').fill('2026-06-01');
  await page.getByLabel('Ends on').fill('2027-03-31');
  await page.getByRole('button', { name: 'Add academic year' }).click();
  await expect(page.getByText('2026-27 (2026-06-01 to 2027-03-31)')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('combobox', { name: 'Academic year', exact: true }).selectOption({ label: '2026-27' });
  await page.getByLabel('Class name').fill('Class 6');
  await page.getByRole('button', { name: 'Add class' }).click();
  await expect(page.getByRole('link', { name: 'Class 6', exact: true })).toBeVisible();
  await page.getByLabel('Class name').fill('Class 7');
  await page.getByRole('button', { name: 'Add class' }).click();
  const class7Href = await page.getByRole('link', { name: 'Class 7', exact: true }).getAttribute('href');
  expect(class7Href).toBeTruthy();

  await page.getByRole('combobox', { name: 'Class', exact: true }).selectOption({ label: 'Class 6' });
  await page.getByLabel('Section name').fill('A');
  await page.getByRole('button', { name: 'Add section' }).click();
  await expect(page.getByRole('link', { name: 'Class 6 section A' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Class', exact: true }).selectOption({ label: 'Class 7' });
  await page.getByLabel('Section name').fill('A');
  await page.getByRole('button', { name: 'Add section' }).click();
  await expect(page.getByRole('link', { name: 'Class 7 section A' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('combobox', { name: 'Class', exact: true }).selectOption({ label: 'Class 6' });
  await page.getByLabel('Subject name').fill('Mathematics');
  await page.getByRole('button', { name: 'Add subject' }).click();
  await expect(page.getByRole('link', { name: 'Class 6: Mathematics' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Class', exact: true }).selectOption({ label: 'Class 7' });
  await page.getByLabel('Subject name').fill('Mathematics');
  await page.getByRole('button', { name: 'Add subject' }).click();
  await expect(page.getByRole('link', { name: 'Class 7: Mathematics' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Email').fill(teacherEmail);
  await page.getByRole('checkbox', { name: 'Class 6 section A, Mathematics' }).check();
  await page.getByRole('button', { name: 'Create invitation' }).click();
  const invitation = await page.getByTestId('invitation-link').getAttribute('href');
  expect(invitation).toContain('/accept-invite?token=');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('combobox', { name: 'Section', exact: true }).selectOption({ label: 'Class 6 section A' });
  await page.getByLabel('Roster CSV').fill('name,rollNumber\nAsha Rao,01\n,2\nBala Rao,02\n');
  await page.getByRole('button', { name: 'Import roster' }).click();
  await expect(page.getByTestId('roster-errors')).toContainText('Row 3: Check the student name and roll number.');
  await expect(page.getByTestId('roster-imported')).toHaveText('Imported 2 students.');
  await page.getByRole('link', { name: 'Print activation codes' }).click();
  await expect(page.getByRole('list', { name: 'Activation codes' }).getByText('Asha Rao')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Activation codes' }).getByText('Bala Rao')).toBeVisible();
  await expect(page.getByText('Row 3')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screenshots/claim-sheet-1280.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await expectNoOverflow(page);
  await page.screenshot({ path: 'e2e/screenshots/claim-sheet-360.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
  await page.screenshot({ path: 'e2e/screenshots/claim-sheet-print.png', fullPage: true });
  await page.emulateMedia({ media: 'screen' });

  const teacherContext = await browser.newContext({ baseURL });
  const teacherErrors: string[] = [];
  teacherContext.on('page', (next) => {
    next.on('console', (message) => { if (message.type() === 'error') teacherErrors.push(message.text()); });
    next.on('pageerror', (error) => { teacherErrors.push(error.message); });
  });
  const teacherPage = await teacherContext.newPage();
  await teacherPage.setViewportSize({ width: 1280, height: 900 });
  await teacherPage.goto(invitation ?? '/accept-invite');
  await teacherPage.getByLabel('Your name').fill('Kiran Das');
  await teacherPage.getByLabel('Password').fill('correct horse battery');
  await teacherPage.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(teacherPage).toHaveURL('/teacher/onboarding');
  await teacherPage.getByRole('link', { name: 'Go to teacher home' }).click();
  await expect(teacherPage.getByText('signed in as the teacher')).toBeVisible();
  await expect(teacherPage.getByRole('list', { name: 'Classes' }).getByRole('link', { name: 'Class 6', exact: true })).toBeVisible();
  await expect(teacherPage.getByRole('list', { name: 'Class 6 subjects' }).getByText('Mathematics')).toBeVisible();
  await expect(teacherPage.getByText('Class 7')).toHaveCount(0);
  await expectAxe(teacherPage);

  const class7Id = class7Href?.split('/').pop();
  await teacherPage.goto(`/teacher/classes/${class7Id}`);
  await expect(teacherPage.getByRole('heading', { level: 1, name: 'This page isn’t available for this account.' })).toBeVisible();
  await expect(teacherPage.getByText('Class 7')).toHaveCount(0);
  await teacherContext.close();
  expect(teacherErrors.filter((error) => !error.includes('net::ERR_') && !error.includes('status of 401') && !error.includes('status of 404'))).toEqual([]);
});
