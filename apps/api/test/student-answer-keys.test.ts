import { and, eq } from 'drizzle-orm';
import { expect, it } from 'vitest';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { assignments, chapters, concepts, learningSessions, profiles } from '../src/db/schema.ts';
import { cookieFrom, createHarness, PASSWORD, PIN } from './helpers.ts';

const KEYS = /^(answer|answers|answerKey|correctOptionId|correctAnswer|acceptedAnswers|gapAnswers|pairs|solution|rubric|isCorrect|expected)$/;
function scan(value: unknown, path: string, out: string[]) {
  if (Array.isArray(value)) value.forEach((v, i) => scan(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { if (KEYS.test(k) && typeof v !== 'number') out.push(`${path}.${k}=${JSON.stringify(v).slice(0, 60)}`); scan(v, `${path}.${k}`, out); }
}
it('serves student-facing content without answer keys', async () => {
  const h = await createHarness();
  await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  const db = h.database.db;
  const aarav = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Aarav'))).get()!;
  const cookie = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
  const paths = ['/student/home', '/student/daily-challenge', '/student/dushman', '/student/games', '/student/homework', '/student/study-plan', '/assignments', '/concept-states', '/my-class', '/student/subjects-board'];
  const leaks: string[] = []; let served = 0;
  for (const c of db.select().from(chapters).where(eq(chapters.schoolId, DEMO_SCHOOL_ID)).all().slice(0, 3)) paths.push(`/chapters/${c.id}`, `/chapters/${c.id}/diagnostic`, `/chapters/${c.id}/notebook-diagnostic`, `/chapters/${c.id}/practice`, `/chapters/${c.id}/practice/next`, `/chapters/${c.id}/items`, `/chapters/${c.id}/sessions`, `/chapters/${c.id}/concepts`);
  for (const c of db.select().from(concepts).where(eq(concepts.schoolId, DEMO_SCHOOL_ID)).all().slice(0, 3)) paths.push(`/concepts/${c.id}/lesson`, `/concepts/${c.id}/notebook-lesson`, `/concepts/${c.id}/remediation`, `/concepts/${c.id}/gap`);
  for (const a of db.select().from(assignments).where(eq(assignments.schoolId, DEMO_SCHOOL_ID)).all().slice(0, 3)) paths.push(`/assignments/${a.id}`, `/student/homework/${a.id}/draft`, `/assignments/${a.id}/attempts`);
  for (const s of db.select().from(learningSessions).where(eq(learningSessions.schoolId, DEMO_SCHOOL_ID)).all().slice(0, 2)) paths.push(`/sessions/${s.id}`);
  for (const p of paths) {
    const r = await h.app.inject({ url: p, headers: { cookie } });
    const out: string[] = [];
    if (r.statusCode === 200) { served += 1; scan(r.json(), '', out); }
    leaks.push(...out.map((line) => `${p} ${line}`));
  }
  expect(served).toBeGreaterThan(30);
  expect(leaks).toEqual([]);
  await h.app.close();
});
