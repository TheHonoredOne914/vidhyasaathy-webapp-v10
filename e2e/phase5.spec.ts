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
  await page.screenshot({ path: `e2e/screenshots/p5-${name}.png`, fullPage: true });
}

test('ask, plan, concept map, remediation and unapproved drafts', async ({ page, browser }) => {
  const stamp = Date.now();
  const adminEmail = `admin-${stamp}@example.test`;
  const teacherEmail = `teacher-${stamp}@example.test`;
  await page.setViewportSize({ width: 1280, height: 900 });
  await registerSchool(page, 'North Ridge School', adminEmail);

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
  const halves = await api<{ id: string }>(teacherPage, 'POST', `/chapters/${chapter.id}/concepts`, { title: 'Halves', description: 'Equal parts.', prerequisiteIds: [] });
  await api(teacherPage, 'POST', `/chapters/${chapter.id}/concepts`, { title: 'Quarters', description: 'Four equal parts.', prerequisiteIds: [halves.id] });
  const note = await api<{ id: string }>(teacherPage, 'POST', `/chapters/${chapter.id}/notes`, {
    title: 'Fractions notes',
    body: 'Fractions divide a whole into equal parts. One half is one of two equal parts.',
    conceptIds: [halves.id],
  });
  await api(teacherPage, 'POST', `/notes/${note.id}/publish`, {});
  const question = (prompt: string, options: string[], answer: string, source: boolean) => ({
    conceptId: halves.id, prompt, difficulty: 1, sourceRef: source ? { noteId: note.id, locator: 'Text opening' } : null,
    type: 'mcq', options, answer,
  });
  const first = await api<{ id: string }>(teacherPage, 'POST', `/chapters/${chapter.id}/sessions`, {
    sectionId: section.id, title: 'Fractions check',
    slides: [{ conceptId: halves.id, title: 'Equal parts', body: 'A fraction splits a whole into equal parts.', noteId: note.id }],
    check: [
      question('How many equal parts are in one half?', ['two', 'three'], 'two', true),
      question('Are the parts equal?', ['yes', 'no'], 'yes', true),
      question('Two halves make a whole?', ['two', 'three'], 'two', false),
    ],
  });
  await api(teacherPage, 'POST', `/sessions/${first.id}/publish`, {});
  const next = await api<{ id: string }>(teacherPage, 'POST', `/chapters/${chapter.id}/sessions`, {
    sectionId: section.id, title: 'Next fractions',
    slides: [{ conceptId: halves.id, title: 'Use halves again', body: 'The next step still uses halves.', noteId: note.id }],
    check: [question('Still equal?', ['yes', 'no'], 'yes', false)],
  });
  await api(teacherPage, 'POST', `/sessions/${next.id}/publish`, {});

  await teacherPage.goto(`/teacher/notes/${note.id}`);
  await teacherPage.getByLabel('Section').selectOption({ label: 'Class 6 section A' });
  await teacherPage.getByRole('button', { name: 'Draft a session and quiz' }).click();
  await expect(teacherPage).toHaveURL(/\/teacher\/ai\/drafts\//);
  await expect(teacherPage.getByTestId('draft-status')).toContainText('AI not configured', { timeout: 15000 });
  await shot(teacherPage, 'draft');
  const sessions = await api<{ title: string; status: string }[]>(teacherPage, 'GET', `/chapters/${chapter.id}/sessions`);
  expect(sessions.map((item) => item.title).sort()).toEqual(['Fractions check', 'Next fractions']);
  expect(sessions.every((item) => item.status === 'published')).toBe(true);

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

  await studentPage.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Ask Saathy' }).click();
  await studentPage.getByLabel('Subject').selectOption({ label: 'Mathematics' });
  await studentPage.getByLabel('Chapter').selectOption({ label: 'Fractions' });
  await studentPage.getByLabel('Question').fill('Explain volcanoes');
  await studentPage.getByRole('button', { name: 'Ask Saathy' }).click();
  await expect(studentPage.getByTestId('ai-state')).toContainText('not in your notes');
  await expect(studentPage.getByText('Hint 1 of 3. Socratic mode is off.')).toBeVisible();
  await studentPage.getByRole('checkbox', { name: 'Socratic mode' }).check();
  await expect(studentPage.getByTestId('ai-state')).toHaveCount(0);
  await studentPage.getByRole('checkbox', { name: 'Socratic mode' }).uncheck();
  await studentPage.getByLabel('Question').fill('Explain fractions');
  await studentPage.getByRole('button', { name: 'Ask Saathy' }).click();
  await expect(studentPage.getByTestId('ai-state')).toContainText('AI not configured');
  await shot(studentPage, 'ask');
  const askAxe = await new AxeBuilder({ page: studentPage }).analyze();
  expect(askAxe.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);

  await studentPage.goto(`/student/chapters/${chapter.id}`);
  await expect(studentPage.getByRole('link', { name: 'Halves', exact: true })).toBeVisible();
  await expect(studentPage.getByText('Needs Halves.')).toBeVisible();
  await shot(studentPage, 'map');

  await studentPage.goto(`/student/sessions/${first.id}`);
  await studentPage.getByRole('button', { name: 'Continue to the check' }).click();
  await studentPage.getByRole('group', { name: 'How many equal parts are in one half?' }).getByRole('radio', { name: 'two' }).check();
  await studentPage.getByRole('group', { name: 'Are the parts equal?' }).getByRole('radio', { name: 'no' }).check();
  await studentPage.getByRole('group', { name: 'Two halves make a whole?' }).getByRole('radio', { name: 'two' }).check();
  for (const sure of await studentPage.getByRole('radio', { name: 'Sure' }).all()) await sure.check();
  await studentPage.getByRole('button', { name: 'Submit check' }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'Session complete' })).toBeVisible();

  await studentPage.goto(`/student/sessions/${next.id}`);
  await studentPage.getByRole('button', { name: 'Continue to the check' }).click();
  await studentPage.getByRole('link', { name: 'Open the short lesson and two-question check' }).click();
  await expect(studentPage.getByTestId('remediation-status')).toContainText('Both answers need to be correct');
  await expect(studentPage.getByText('Fractions divide a whole into equal parts.')).toBeVisible();
  await expect(studentPage.getByRole('link', { name: /From your teacher/ })).toBeVisible();
  await shot(studentPage, 'remediation');
  await studentPage.getByRole('group', { name: 'How many equal parts are in one half?' }).getByRole('radio', { name: 'three' }).check();
  await studentPage.getByRole('group', { name: 'Are the parts equal?' }).getByRole('radio', { name: 'no' }).check();
  await studentPage.getByRole('button', { name: 'Submit both answers' }).click();
  await expect(studentPage.getByText('0 of 2 correct. Both answers need to be correct.')).toBeVisible();
  await studentPage.getByRole('group', { name: 'How many equal parts are in one half?' }).getByRole('radio', { name: 'two' }).check();
  await studentPage.getByRole('group', { name: 'Are the parts equal?' }).getByRole('radio', { name: 'yes' }).check();
  await studentPage.getByRole('button', { name: 'Submit both answers' }).click();
  await expect(studentPage.getByTestId('remediation-status')).toHaveText('Passed on the second check.');

  await studentPage.goto('/student');
  await expect(studentPage.getByRole('link', { name: 'Subjects', exact: true })).toBeVisible();
  await expect(studentPage.getByRole('link', { name: 'Next fractions' })).toBeVisible();
  await shot(studentPage, 'plan');

  expect(teacherErrors.filter((error) => !error.includes('status of 403'))).toEqual([]);
  expect(studentErrors.filter((error) => !error.includes('status of 403'))).toEqual([]);
  await teacherContext.close();
  await studentContext.close();
});
