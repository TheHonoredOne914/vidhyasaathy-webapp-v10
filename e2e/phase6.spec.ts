import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { registerSchool } from './registerSchool.ts';
import { seedLinkedParent } from './seed.ts';
import { baseURL, databasePath, ensureServers, stopServers } from './server.ts';

const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => { errors.push(error.message); });
    await use();
    expect(errors.filter((error) => !error.includes('net::ERR_') && !error.includes('status of 401') && !error.includes('status of 403') && !error.includes('status of 404'))).toEqual([]);
  }, { auto: true }],
});

test.describe.configure({ mode: 'serial', timeout: 180000 });
test.use({ baseURL });

test.beforeAll(async () => { await ensureServers(); }, { timeout: 120000 });
test.afterAll(async () => { await stopServers(); });

async function api<T>(page: Page, method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
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
  await page.screenshot({ path: `e2e/screenshots/p6-${name}.png`, fullPage: true });
}

test('dashboards, announcements, and parent access', async ({ page, browser }) => {
  const stamp = Date.now();
  const teacherEmail = `teacher-${stamp}@example.test`;
  await page.setViewportSize({ width: 1280, height: 900 });
  await registerSchool(page, 'North Ridge School', `admin-${stamp}@example.test`);
  await expect(page).toHaveURL(/\/admin/);
  const me = await api<{ school: { id: string } }>(page, 'GET', '/me');
  const year = await api<{ id: string }>(page, 'POST', '/admin/academic-years', { name: '2026-27', startsOn: '2026-06-01', endsOn: '2027-03-31' });
  const schoolClass = await api<{ id: string }>(page, 'POST', '/admin/classes', { academicYearId: year.id, name: 'Class 6' });
  const section = await api<{ id: string }>(page, 'POST', '/admin/sections', { classId: schoolClass.id, name: 'A' });
  const subject = await api<{ id: string }>(page, 'POST', '/admin/subjects', { classId: schoolClass.id, name: 'Mathematics' });
  const invite = await api<{ token: string }>(page, 'POST', '/admin/invite-teacher', {
    email: teacherEmail, assignments: [{ sectionId: section.id, subjectId: subject.id }],
  });
  const roster = await api<{ claimCodeSheet: { entries: { name: string; profileId: string; code: string }[] } }>(page, 'POST', '/admin/import-roster', {
    sectionId: section.id, csv: 'name,rollNumber\nAsha Rao,01\nMira Sen,02\n',
  });
  const asha = roster.claimCodeSheet.entries.find((entry) => entry.name === 'Asha Rao');
  const mira = roster.claimCodeSheet.entries.find((entry) => entry.name === 'Mira Sen');
  expect(asha?.code).toBeTruthy();
  expect(mira?.profileId).toBeTruthy();

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
  const note = await api<{ id: string }>(teacherPage, 'POST', `/chapters/${chapter.id}/notes`, {
    title: 'Fractions notes', body: 'One half is one of two equal parts.', conceptIds: [halves.id],
  });
  await api(teacherPage, 'POST', `/notes/${note.id}/publish`, {});
  const question = (prompt: string, options: string[], answer: string) => ({
    conceptId: halves.id, prompt, difficulty: 1, sourceRef: { noteId: note.id, locator: 'Text opening' }, type: 'mcq', options, answer,
  });
  const session = await api<{ id: string }>(teacherPage, 'POST', `/chapters/${chapter.id}/sessions`, {
    sectionId: section.id, title: 'Fractions check',
    slides: [{ conceptId: halves.id, title: 'Equal parts', body: 'A fraction splits a whole into equal parts.', noteId: note.id }],
    check: [
      question('How many equal parts are in one half?', ['two', 'three'], 'two'),
      question('Are the parts equal?', ['yes', 'no'], 'yes'),
    ],
  });
  await api(teacherPage, 'POST', `/sessions/${session.id}/publish`, {});
  const before = await api<{ concepts: { attempts: number }[] }>(teacherPage, 'GET', `/sections/${section.id}/insights`);
  expect(before.concepts.find((concept) => concept.attempts === 0)).toBeTruthy();

  const studentContext = await browser.newContext({ baseURL });
  const studentPage = await studentContext.newPage();
  const studentErrors = watch(studentPage);
  await studentPage.setViewportSize({ width: 1280, height: 900 });
  await studentPage.goto('/claim');
  await studentPage.getByLabel('Activation code').fill(asha?.code ?? '');
  await studentPage.getByLabel('PIN').fill('2468');
  await studentPage.getByRole('button', { name: 'Continue' }).click();
  await expect(studentPage).toHaveURL('/student/welcome');
  await studentPage.goto(`/student/sessions/${session.id}`);
  await studentPage.getByRole('button', { name: 'Continue to the check' }).click();
  await studentPage.getByRole('group', { name: 'How many equal parts are in one half?' }).getByRole('radio', { name: 'two' }).check();
  await studentPage.getByRole('group', { name: 'Are the parts equal?' }).getByRole('radio', { name: 'yes' }).check();
  for (const sure of await studentPage.getByRole('radio', { name: 'Sure' }).all()) await sure.check();
  await studentPage.getByRole('button', { name: 'Submit check' }).click();
  await expect(studentPage.getByRole('heading', { level: 1, name: 'Session complete' })).toBeVisible();

  const after = await api<{ concepts: { title: string; attempts: number }[] }>(teacherPage, 'GET', `/sections/${section.id}/insights`);
  expect(after.concepts.find((concept) => concept.title === 'Halves')?.attempts).toBeGreaterThan(0);

  await teacherPage.goto('/teacher');
  await expect(teacherPage.getByText('signed in as the teacher')).toBeVisible();
  await expect(teacherPage.getByText(/marked\./).first()).toBeVisible();
  await shot(teacherPage, 'teacher-home');
  await teacherPage.goto(`/teacher/sections/${section.id}/insights`);
  await expect(teacherPage.getByText('2 marked.')).toBeVisible();
  await teacherPage.getByLabel('Concept', { exact: true }).selectOption({ label: 'Halves' });
  await teacherPage.getByRole('radio', { name: 'Reteach' }).check();
  await teacherPage.getByLabel('Note').fill('Teach halves again tomorrow.');
  await teacherPage.getByRole('button', { name: 'Save decision' }).click();
  await expect(teacherPage.getByText('Teach halves again tomorrow.')).toBeVisible();
  await shot(teacherPage, 'insights');
  const insightsAxe = await new AxeBuilder({ page: teacherPage }).analyze();
  expect(insightsAxe.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);

  const alerts = { enabled: true, quietStart: 0, quietEnd: 0, utcOffsetMinutes: 330, reducedMotion: false };
  await api(teacherPage, 'PUT', '/notification-settings', alerts);
  await api(studentPage, 'PUT', '/notification-settings', alerts);
  await teacherPage.goto('/teacher/announcements');
  await teacherPage.getByLabel('Section').selectOption({ label: 'Class 6 section A' });
  await teacherPage.getByLabel('Title').fill('Fractions reminder');
  await teacherPage.getByLabel('Message').fill('Bring your notebook tomorrow.');
  await teacherPage.getByLabel('Audience').selectOption({ label: 'Students and parents' });
  await teacherPage.getByRole('checkbox', { name: 'Email' }).check();
  await teacherPage.getByRole('button', { name: 'Post announcement' }).click();
  await expect(teacherPage.getByRole('heading', { name: 'Fractions reminder' })).toBeVisible();
  await shot(teacherPage, 'announcements');
  await teacherPage.goto('/teacher/settings');
  await teacherPage.getByRole('checkbox', { name: 'Reduced motion' }).check();
  await teacherPage.getByRole('button', { name: 'Save settings' }).click();
  await expect(teacherPage.getByRole('status')).toHaveText('Saved.');
  await shot(teacherPage, 'settings');

  await studentPage.goto('/student/progress');
  await expect(studentPage.getByTestId('progress-summary')).toContainText('2 marked.');
  await shot(studentPage, 'progress');
  await studentPage.goto('/student/notifications');
  await expect(studentPage.getByText('email delivery is not configured.')).toBeVisible();
  await shot(studentPage, 'notifications');
  await studentPage.goto('/student');
  await expect(studentPage.getByText('Fractions reminder')).toBeVisible();

  const parentContext = await browser.newContext({ baseURL });
  await parentContext.addCookies([{ name: 'vidhyasaathy_session', value: seedLinkedParent(databasePath, me.school.id, 'Leela Rao', asha?.profileId ?? ''), url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
  const parentPage = await parentContext.newPage();
  const parentErrors = watch(parentPage);
  await parentPage.setViewportSize({ width: 1280, height: 900 });
  await parentPage.goto('/parent');
  await expect(parentPage.getByRole('heading', { level: 1, name: 'Hello, Leela Rao' })).toBeVisible();
  await shot(parentPage, 'parent-home');
  await parentPage.getByRole('link', { name: 'Open Asha Rao' }).click();
  await expect(parentPage.getByText('Teach halves again tomorrow.')).toBeVisible();
  await expect(parentPage.getByText('Fractions reminder')).toBeVisible();
  await expect(parentPage.getByText('Private chats are not shown.')).toBeVisible();
  await shot(parentPage, 'parent-child');
  await parentPage.goto(`/parent/children/${mira?.profileId}`);
  await expect(parentPage.getByRole('heading', { name: 'This page isn’t available for this account.' })).toBeVisible();

  await page.goto('/admin/activity');
  await expect(page.getByRole('heading', { name: 'Activity log' })).toBeVisible();
  await expect(page.getByText(/auth\.|school\.|dashboard\./).first()).toBeVisible();
  await shot(page, 'audit');

  const noise = (error: string) => ['status of 401', 'status of 403', 'status of 404'].some((item) => error.includes(item));
  expect(teacherErrors.filter((error) => !noise(error))).toEqual([]);
  expect(studentErrors.filter((error) => !noise(error))).toEqual([]);
  expect(parentErrors.filter((error) => !noise(error))).toEqual([]);
  await teacherContext.close();
  await studentContext.close();
  await parentContext.close();
});
