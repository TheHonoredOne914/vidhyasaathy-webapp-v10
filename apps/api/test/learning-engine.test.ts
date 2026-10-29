import { DiagnosticOfferSchema, DiagnosticResultSchema, ProgressSchema, TeacherDashboardSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashCredential } from '../src/auth/security.ts';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { chapters, profiles, users } from '../src/db/schema.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';

describe('learning engine on the demo school', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  });
  afterEach(async () => { await h.app.close(); h.database.close(); });

  function studentCookie(name: string) {
    const profile = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, name))).get()!;
    return profile;
  }

  it('keeps chapter bands off the student progress page and on the teacher desk', async () => {
    const aarav = studentCookie('Aarav');
    const student = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
    const progress = await h.app.inject({ url: '/progress', headers: { cookie: student } });
    expect(progress.statusCode).toBe(200);
    expect(progress.body).not.toContain('0-25');
    expect(progress.body).not.toContain('"band"');
    expect(ProgressSchema.parse(progress.json()).masteryWords.some((row) => row.word === 'Top form')).toBe(true);
    const teacherProfile = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, 'teacher'))).get()!;
    h.database.db.update(users).set({ pinHash: await hashCredential('1357') }).where(eq(users.id, teacherProfile.userId)).run();
    const teacher = cookieFrom((await h.post('/auth/login', { email: 'teacher@demo.invalid', password: PASSWORD })).headers);
    const desk = TeacherDashboardSchema.parse((await h.app.inject({ url: '/dashboard/teacher', headers: { cookie: teacher } })).json());
    expect(desk.bands.some((row) => row.studentName === 'Aarav' && row.band === '75-100')).toBe(true);
  });

  it('offers a prerequisite diagnostic and never returns an answer key or a band', async () => {
    const aarav = studentCookie('Aarav');
    const student = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
    const chapterId = h.database.db.select().from(chapters).where(eq(chapters.title, 'Motion')).get()!.id;
    const offer = DiagnosticOfferSchema.parse((await h.app.inject({ url: `/chapters/${chapterId}/diagnostic`, headers: { cookie: student } })).json());
    expect(offer.offered).toBe(true);
    expect(offer.questions.length).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(offer.questions)).not.toContain('"answer"');
    expect(offer.questions.every((question) => question.type === 'mcq' && question.options.includes("Haven't learned this yet"))).toBe(true);
    const result = await h.post(`/chapters/${chapterId}/diagnostic`, {
      answers: offer.questions.map((question) => ({ itemId: question.id, answer: "Haven't learned this yet", confidence: 'unsure' })),
    }, student);
    expect(result.statusCode).toBe(200);
    const parsed = DiagnosticResultSchema.parse(result.json());
    expect(parsed.word).toBe('New');
    expect(JSON.stringify(parsed)).not.toContain('band');
    expect(DiagnosticOfferSchema.parse((await h.app.inject({ url: `/chapters/${chapterId}/diagnostic`, headers: { cookie: student } })).json()).offered).toBe(false);
  });
});
