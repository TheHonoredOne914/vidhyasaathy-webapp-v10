import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
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
    expect(errors.filter((error) => !error.includes('net::ERR_') && !error.includes('status of 401') && !error.includes('status of 403') && !error.includes('status of 404'))).toEqual([]);
  }, { auto: true }],
});

test.describe.configure({ mode: 'serial', timeout: 180000 });
test.use({ baseURL });

test.beforeAll(async () => {
  await ensureServers();
}, { timeout: 120000 });

test.afterAll(async () => {
  await stopServers();
});

async function api<T>(page: Page, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  return page.evaluate(async ({ method: verb, path: requestPath, body: payload }) => {
    const response = await fetch(requestPath, {
      method: verb,
      credentials: 'include',
      headers: payload === undefined ? undefined : { 'content-type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${verb} ${requestPath} ${response.status} ${text}`);
    return JSON.parse(text) as T;
  }, { method, path: `/api${path}`, body });
}

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => { errors.push(error.message); });
  return errors;
}

async function shot(page: Page, name: string): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: `e2e/screenshots/p3-${name}.png`, fullPage: true });
}

test('teacher publishes a session and the student cannot skip or finish early', async ({ page, browser }) => {
  const stamp = Date.now();
  const adminEmail = `admin-${stamp}@example.test`;
  const teacherEmail = `teacher-${stamp}@example.test`;
  await page.setViewportSize({ width: 1280, height: 900 });
  await registerSchool(page, 'North Ridge School', adminEmail);
  await expect(page.getByRole('heading', { level: 1, name: 'School setup' })).toBeVisible();

  const year = await api<{ id: string }>(page, 'POST', '/admin/academic-years', { name: '2026-27', startsOn: '2026-06-01', endsOn: '2027-03-31' });
  const schoolClass = await api<{ id: string }>(page, 'POST', '/admin/classes', { academicYearId: year.id, name: 'Class 6' });
  const section = await api<{ id: string }>(page, 'POST', '/admin/sections', { classId: schoolClass.id, name: 'A' });
  const subject = await api<{ id: string }>(page, 'POST', '/admin/subjects', { classId: schoolClass.id, name: 'Mathematics' });
  const invite = await api<{ token: string }>(page, 'POST', '/admin/invite-teacher', {
    email: teacherEmail, assignments: [{ sectionId: section.id, subjectId: subject.id }],
  });
  const roster = await api<{ claimCodeSheet: { entries: { code: string }[] } }>(page, 'POST', '/admin/import-roster', {
    sectionId: section.id, csv: 'name,rollNumber\nAsha Rao,01\n',
  });
  const claimCode = roster.claimCodeSheet.entries[0]?.code;
  expect(claimCode).toBeTruthy();

  const teacherContext = await browser.newContext({ baseURL });
  const teacherPage = await teacherContext.newPage();
  const teacherErrors = watch(teacherPage);
  await teacherPage.setViewportSize({ width: 1280, height: 900 });
  await teacherPage.goto(`/accept-invite?token=${invite.token}`);
  await teacherPage.getByLabel('Your name').fill('Kiran Das');
  await teacherPage.getByLabel('Password').fill('correct horse battery');
  await teacherPage.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(teacherPage).toHaveURL('/teacher/onboarding');
  await teacherPage.goto('/teacher/subjects');
  await teacherPage.getByRole('link', { name: 'Class 6: Mathematics' }).click();
  await teacherPage.getByLabel('Chapter title').fill('Fractions');
  await teacherPage.getByRole('button', { name: 'Add chapter' }).click();
  await expect(teacherPage.getByRole('link', { name: 'Fractions' })).toBeVisible();
  await shot(teacherPage, 'lesson-editor');
  await teacherPage.getByRole('link', { name: 'Fractions' }).click();
  await teacherPage.getByLabel('Concept title').fill('Numerator');
  await teacherPage.getByLabel('Description').fill('The top number in a fraction.');
  await teacherPage.getByRole('button', { name: 'Add concept' }).click();
  await expect(teacherPage.getByRole('link', { name: 'Numerator', exact: true })).toBeVisible();
  await teacherPage.getByLabel('Note title').fill('Numerator note');
  await teacherPage.getByLabel('Note', { exact: true }).fill('The numerator is the top number of a fraction.');
  await teacherPage.getByRole('group', { name: 'Concepts' }).getByRole('checkbox', { name: 'Numerator' }).check();
  await teacherPage.getByRole('button', { name: 'Save note' }).click();
  await expect(teacherPage.getByRole('heading', { level: 1, name: 'Numerator note' })).toBeVisible();
  await teacherPage.getByLabel('File').setInputFiles({ name: 'numerator.txt', mimeType: 'text/plain', buffer: Buffer.from('The numerator is the top number.\n') });
  await teacherPage.getByRole('button', { name: 'Upload file' }).click();
  await expect(teacherPage.getByText('numerator.txt')).toBeVisible();
  await shot(teacherPage, 'note');
  await teacherPage.getByRole('button', { name: 'Publish now' }).click();
  await expect(teacherPage.getByText('Published notes stay as they are.')).toBeVisible();
  await teacherPage.getByRole('link', { name: 'Back to the chapter' }).click();
  await teacherPage.getByRole('link', { name: 'Numerator', exact: true }).click();
  await expect(teacherPage.getByRole('paragraph').filter({ hasText: 'The top number in a fraction.' })).toBeVisible();
  await shot(teacherPage, 'concept');
  await teacherPage.getByRole('link', { name: 'Back to the chapter' }).click();
  await shot(teacherPage, 'chapter');
  await teacherPage.getByRole('link', { name: 'Create a session' }).click();
  await teacherPage.getByLabel('Session title').fill('Fractions check');
  await teacherPage.getByLabel('Section').selectOption({ label: 'Class 6 section A' });
  const slide1 = teacherPage.getByRole('group', { name: 'Slide 1' });
  await slide1.getByLabel('Concept').selectOption({ label: 'Numerator' });
  await slide1.getByLabel('Title').fill('What a fraction is');
  await slide1.getByLabel('Text').fill('A fraction names equal parts of a whole.');
  await slide1.getByLabel('Note').selectOption({ label: 'Numerator note' });
  await teacherPage.getByRole('button', { name: 'Add slide' }).click();
  const slide2 = teacherPage.getByRole('group', { name: 'Slide 2' });
  await slide2.getByLabel('Concept').selectOption({ label: 'Numerator' });
  await slide2.getByLabel('Title').fill('The numerator');
  await slide2.getByLabel('Text').fill('The numerator is the top number.');
  const check = teacherPage.getByRole('group', { name: 'Check' });
  await check.getByLabel('Concept').selectOption({ label: 'Numerator' });
  await check.getByLabel('Question').fill('Which part is the numerator?');
  await check.getByLabel('Option 1').fill('The top number');
  await check.getByLabel('Option 2').fill('The bottom number');
  await check.getByLabel('Correct answer').selectOption({ label: 'The top number' });
  await check.getByLabel('Source note').selectOption({ label: 'Numerator note' });
  await shot(teacherPage, 'session-builder');
  await teacherPage.getByRole('button', { name: 'Save session' }).click();
  await expect(teacherPage).toHaveURL(/\/teacher\/sessions\//);
  await teacherPage.getByRole('button', { name: 'Publish now' }).click();
  await expect(teacherPage.getByText('Published sessions stay as they are.')).toBeVisible();
  const sessionId = teacherPage.url().split('/').pop() ?? '';
  const saved = await api<{ slides: { id: string; title: string }[]; check: { id: string }[] }>(teacherPage, 'GET', `/sessions/${sessionId}`);
  const lockedSlide = saved.slides.find((slide) => slide.title === 'The numerator');
  expect(lockedSlide).toBeTruthy();

  await teacherPage.getByRole('link', { name: 'Back to the chapter' }).click();
  await teacherPage.getByRole('link', { name: 'Create a session' }).click();
  await teacherPage.getByLabel('Session title').fill('Later fractions');
  await teacherPage.getByLabel('Section').selectOption({ label: 'Class 6 section A' });
  const laterSlide = teacherPage.getByRole('group', { name: 'Slide 1' });
  await laterSlide.getByLabel('Concept').selectOption({ label: 'Numerator' });
  await laterSlide.getByLabel('Title').fill('Not yet');
  await laterSlide.getByLabel('Text').fill('This session waits for its release.');
  const laterCheck = teacherPage.getByRole('group', { name: 'Check' });
  await laterCheck.getByLabel('Concept').selectOption({ label: 'Numerator' });
  await laterCheck.getByLabel('Question').fill('Is this released?');
  await laterCheck.getByLabel('Option 1').fill('Yes');
  await laterCheck.getByLabel('Option 2').fill('No');
  await laterCheck.getByLabel('Correct answer').selectOption({ label: 'No' });
  await teacherPage.getByRole('button', { name: 'Save session' }).click();
  await expect(teacherPage).toHaveURL(/\/teacher\/sessions\//);
  await teacherPage.getByLabel('Release time').fill('2099-01-01T09:00');
  await teacherPage.getByRole('button', { name: 'Schedule release' }).click();
  await expect(teacherPage.getByText(/Releases/)).toBeVisible();
  const laterId = teacherPage.url().split('/').pop() ?? '';

  const studentContext = await browser.newContext({ baseURL });
  const studentPage = await studentContext.newPage();
  const studentErrors = watch(studentPage);
  await studentPage.setViewportSize({ width: 1280, height: 900 });
  await studentPage.goto('/claim');
  await studentPage.getByLabel('Activation code').fill(claimCode ?? '');
  await studentPage.getByLabel('PIN').fill('2468');
  await studentPage.getByRole('button', { name: 'Continue' }).click();
  await expect(studentPage).toHaveURL('/student/welcome');
  await studentPage.getByRole('link', { name: 'Start learning' }).click();
  await studentPage.getByRole('link', { name: 'Subjects' }).click();
  await studentPage.getByRole('link', { name: 'Mathematics' }).click();
  await expect(studentPage.getByTestId('chapter-status')).toHaveText('Not started');
  await shot(studentPage, 'student-chapters');
  await studentPage.getByRole('link', { name: 'Fractions' }).click();
  await expect(studentPage.getByRole('link', { name: 'Fractions check' })).toBeVisible();
  await expect(studentPage.getByText('Later fractions')).toHaveCount(0);
  await shot(studentPage, 'student-chapter');
  await studentPage.getByRole('link', { name: 'Numerator note' }).click();
  await expect(studentPage.getByText('The numerator is the top number of a fraction.')).toBeVisible();
  await shot(studentPage, 'notes');
  await studentPage.getByRole('link', { name: 'Back to the chapter' }).click();
  await studentPage.getByRole('link', { name: 'Fractions check' }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'What a fraction is' })).toBeVisible();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'The numerator' })).toHaveCount(0);
  await expect(studentPage.getByRole('navigation', { name: 'Primary' })).toBeHidden();
  await shot(studentPage, 'session-player');
  const results = await new AxeBuilder({ page: studentPage }).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);

  const skipped = await studentPage.evaluate(async ({ path, slideId }) => {
    const response = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slideId }) });
    return response.status;
  }, { path: `/api/sessions/${sessionId}/advance`, slideId: lockedSlide?.id });
  expect(skipped).toBe(403);
  const early = await studentPage.evaluate(async ({ path, itemId }) => {
    const response = await fetch(path, {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers: [{ itemId, answer: 'The top number' }] }),
    });
    return response.status;
  }, { path: `/api/sessions/${sessionId}/check`, itemId: saved.check[0]?.id });
  expect(early).toBe(403);
  await expect(studentPage.getByRole('heading', { level: 1, name: 'The numerator' })).toHaveCount(0);

  await studentPage.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'The numerator' })).toBeVisible();
  await studentPage.getByRole('button', { name: 'Continue to the check' }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'Check' })).toBeVisible();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'Session complete' })).toHaveCount(0);
  await shot(studentPage, 'session-check');
  await studentPage.getByRole('radio', { name: 'The top number' }).check();
  await studentPage.getByRole('button', { name: 'Submit check' }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'Session complete' })).toBeVisible();
  await expect(studentPage.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await shot(studentPage, 'session-complete');

  await studentPage.goto(`/student/sessions/${laterId}`);
  await expect(studentPage.getByRole('heading', { level: 1, name: /available for this account/i })).toBeVisible();
  await expect(studentPage.getByText('This session waits for its release.')).toHaveCount(0);
  await shot(studentPage, 'unreleased');

  const ignore = (error: string) => error.includes('net::ERR_') || error.includes('status of 401') || error.includes('status of 403') || error.includes('status of 404');
  expect(teacherErrors.filter((error) => !ignore(error))).toEqual([]);
  expect(studentErrors.filter((error) => !ignore(error))).toEqual([]);
  await studentContext.close();
  await teacherContext.close();
});
