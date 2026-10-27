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

test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(120000);
  await ensureServers();
});

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
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/screenshots/p4-${name}.png`, fullPage: true });
}

test('offline homework answer syncs once and the score is visible', async ({ page, browser }) => {
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

  const chapter = await api<{ id: string }>(teacherPage, 'POST', '/chapters', { subjectId: subject.id, title: 'Fractions', position: 0 });
  await api(teacherPage, 'POST', `/chapters/${chapter.id}/concepts`, { title: 'Numerator', description: 'The top number in a fraction.', prerequisiteIds: [] });
  await teacherPage.goto(`/teacher/chapters/${chapter.id}/questions`);
  await teacherPage.getByLabel('Concept').selectOption({ label: 'Numerator' });
  await teacherPage.getByLabel('Question', { exact: true }).fill('Which part is the numerator?');
  await teacherPage.getByLabel('Option 1').fill('The top number');
  await teacherPage.getByLabel('Option 2').fill('The bottom number');
  await teacherPage.getByLabel('Correct answer').selectOption({ label: 'The top number' });
  await teacherPage.getByRole('button', { name: 'Add question' }).click();
  await expect(teacherPage.getByRole('list', { name: 'Questions' }).getByText('Which part is the numerator?')).toBeVisible();
  await teacherPage.getByRole('radio', { name: 'Short answer' }).check();
  await teacherPage.getByLabel('Question', { exact: true }).fill('Where is the numerator?');
  await teacherPage.getByLabel('Accepted answer').fill('top');
  await teacherPage.getByRole('button', { name: 'Add question' }).click();
  await expect(teacherPage.getByRole('list', { name: 'Questions' }).getByText('Where is the numerator?')).toBeVisible();
  await teacherPage.getByRole('button', { name: 'Edit Where is the numerator?', exact: true }).click();
  await teacherPage.getByLabel('Accepted answer').fill('top\nthe top number');
  await teacherPage.getByRole('button', { name: 'Save question' }).click();
  await expect(teacherPage.getByRole('button', { name: 'Add question' })).toBeVisible();
  await teacherPage.getByRole('radio', { name: 'Match pairs' }).check();
  await teacherPage.getByLabel('Question', { exact: true }).fill('Match each part of a fraction.');
  await teacherPage.getByLabel('Pair 1 left').fill('Numerator');
  await teacherPage.getByLabel('Pair 1 right').fill('Top');
  await teacherPage.getByLabel('Pair 2 left').fill('Denominator');
  await teacherPage.getByLabel('Pair 2 right').fill('Bottom');
  await shot(teacherPage, 'question-pairs');
  await teacherPage.getByRole('button', { name: 'Add question' }).click();
  await expect(teacherPage.getByRole('list', { name: 'Questions' }).getByText('Match each part of a fraction.')).toBeVisible();
  await teacherPage.getByRole('radio', { name: 'Flashcard' }).check();
  await teacherPage.getByLabel('Question', { exact: true }).fill('Name the top part of a fraction.');
  await teacherPage.getByLabel('Accepted answer').fill('Numerator');
  await shot(teacherPage, 'question-flashcard');
  await teacherPage.getByRole('button', { name: 'Add question' }).click();
  await expect(teacherPage.getByRole('list', { name: 'Questions' }).getByText('Name the top part of a fraction.')).toBeVisible();
  await shot(teacherPage, 'question-bank');

  await teacherPage.goto(`/teacher/chapters/${chapter.id}/assignments/new`);
  await teacherPage.getByLabel('Assignment title').fill('Numerator homework');
  await teacherPage.getByLabel('Section').selectOption({ label: 'Class 6 section A' });
  const dueValue = await teacherPage.evaluate(() => {
    const date = new Date();
    date.setHours(23, 30, 0, 0);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  });
  await teacherPage.getByLabel('Due').fill(dueValue);
  await teacherPage.getByRole('checkbox', { name: 'Which part is the numerator?' }).check();
  await teacherPage.getByRole('checkbox', { name: 'Where is the numerator?' }).check();
  await shot(teacherPage, 'assignment-builder');
  await teacherPage.getByRole('button', { name: 'Save assignment' }).click();
  await expect(teacherPage).toHaveURL(/\/teacher\/assignments\//);
  await shot(teacherPage, 'assignment');
  await teacherPage.getByRole('button', { name: 'Publish now' }).click();
  await expect(teacherPage.getByRole('heading', { level: 2, name: 'Published' })).toBeVisible();
  const assignmentId = teacherPage.url().split('/').pop() ?? '';
  await teacherPage.goto('/teacher/homework');
  await expect(teacherPage.getByRole('link', { name: 'Numerator homework' })).toBeVisible();
  await shot(teacherPage, 'assignments');

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
  await expect(studentPage.getByRole('link', { name: 'Numerator homework' })).toBeVisible();
  await shot(studentPage, 'student-home');
  await studentPage.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Homework' }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'Homework and quizzes' })).toBeVisible();
  await shot(studentPage, 'homework');
  await studentPage.getByRole('link', { name: 'Numerator homework' }).click();
  await expect(studentPage.getByTestId('assignment-score')).toHaveText('Not started');
  const results = await new AxeBuilder({ page: studentPage }).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);

  await studentContext.setOffline(true);
  const mcq = studentPage.getByRole('group', { name: 'Which part is the numerator?' });
  await mcq.getByRole('radio', { name: 'The top number' }).check();
  await mcq.getByRole('button', { name: 'Save answer' }).click();
  await expect(mcq.getByText('Saved on this device.')).toBeVisible();
  await shot(studentPage, 'answering');
  await studentContext.setOffline(false);
  await expect(studentPage.getByTestId('assignment-score')).toHaveText('1 correct, 1 of 2 answered');
  const attempts = await api<{ itemId: string }[]>(studentPage, 'GET', `/assignments/${assignmentId}/attempts`);
  expect(attempts).toHaveLength(1);

  const short = studentPage.getByRole('group', { name: 'Where is the numerator?' });
  await short.getByLabel('Your answer').fill('the upper part');
  await short.getByRole('button', { name: 'Save answer' }).click();
  await expect(studentPage.getByTestId('assignment-score')).toHaveText('1 correct of 2. Waiting for your teacher.');
  await shot(studentPage, 'score');

  await teacherPage.goto('/teacher/review');
  await expect(teacherPage.getByText('the upper part')).toBeVisible();
  await shot(teacherPage, 'review');
  await teacherPage.getByRole('button', { name: 'Mark not correct' }).click();
  await expect(teacherPage.getByText('No answers are waiting for a mark.')).toBeVisible();
  await studentPage.reload();
  await expect(studentPage.getByTestId('assignment-score')).toHaveText('1 of 2 correct');
  const graded = await api<{ id: string }[]>(studentPage, 'GET', `/assignments/${assignmentId}/attempts`);
  expect(graded).toHaveLength(2);

  // A second assignment can reuse a bank item without the first assignment's
  // queued-answer key hiding its controls. Both remaining public item types work.
  await teacherPage.goto(`/teacher/chapters/${chapter.id}/assignments/new`);
  await teacherPage.getByRole('radio', { name: 'Quiz', exact: true }).check();
  await teacherPage.getByLabel('Assignment title').fill('Fraction practice quiz');
  await teacherPage.getByLabel('Section').selectOption({ label: 'Class 6 section A' });
  await teacherPage.getByLabel('Due').fill(dueValue);
  await teacherPage.getByRole('checkbox', { name: 'Match each part of a fraction.' }).check();
  await teacherPage.getByRole('checkbox', { name: 'Name the top part of a fraction.' }).check();
  await shot(teacherPage, 'quiz-builder');
  await teacherPage.getByRole('button', { name: 'Save assignment' }).click();
  await teacherPage.getByRole('button', { name: 'Publish now' }).click();
  await expect(teacherPage.getByRole('heading', { level: 2, name: 'Published' })).toBeVisible();
  const quizId = teacherPage.url().split('/').pop() ?? '';
  await studentPage.goto(`/student/assignments/${quizId}`);
  const pairs = studentPage.getByRole('group', { name: 'Match each part of a fraction.' });
  await pairs.getByLabel('Numerator', { exact: true }).selectOption({ label: 'Top' });
  await pairs.getByLabel('Denominator', { exact: true }).selectOption({ label: 'Bottom' });
  await pairs.getByRole('button', { name: 'Save answer' }).click();
  await expect(studentPage.getByTestId('assignment-score')).toHaveText('1 correct, 1 of 2 answered');
  const flashcard = studentPage.getByRole('group', { name: 'Name the top part of a fraction.' });
  await flashcard.getByLabel('Your answer').fill('Numerator');
  await flashcard.getByRole('button', { name: 'Save answer' }).click();
  await expect(studentPage.getByTestId('assignment-score')).toHaveText('2 of 2 correct');
  await shot(studentPage, 'quiz-score');

  const ignore = (error: string) => error.includes('net::ERR_') || error.includes('status of 401') || error.includes('status of 403') || error.includes('status of 404');
  expect(teacherErrors.filter((error) => !ignore(error))).toEqual([]);
  expect(studentErrors.filter((error) => !ignore(error))).toEqual([]);
  await studentContext.close();
  await teacherContext.close();
});
