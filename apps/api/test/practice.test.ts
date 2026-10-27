import { randomUUID } from 'node:crypto';
import { PracticeAttemptSchema, PracticeSetSchema, StreakSchema, SyncResponseSchema, type SubmitPracticeAttempt } from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedDemo, DEMO_SCHOOL_ID } from '../src/db/demo.ts';
import { assignments, attempts, chapters, items, learningEvidence, learningSessions, profiles, sections, studentConceptStates } from '../src/db/schema.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';

describe('optional practice and correct-practice streaks', () => {
  let h: Harness, student: string, profileId: string, chapterId: string, itemId: string, conceptId: string;
  const get = (url: string, cookie = student) => h.app.inject({ url, headers: { cookie } });
  const event = (answer = 'Yes'): SubmitPracticeAttempt => ({ clientEventId: randomUUID(), itemId, answer, timeMs: 50, clientTs: h.now() });

  beforeEach(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now());
    const learner = h.database.db.select().from(profiles).all().find((row) => row.role === 'student')!;
    profileId = learner.id;
    student = cookieFrom((await h.post('/auth/pin-login', { profileId, pin: PIN })).headers);
    chapterId = h.database.db.select().from(chapters).get()!.id;
    const item = h.database.db.select().from(items).all().find((row) => row.position === 0)!;
    itemId = item.id; conceptId = item.conceptId;
  });
  afterEach(async () => { await h.app.close(); h.database.close(); });

  it('denies unauthenticated and all non-student roles without leaking practice', async () => {
    expect((await h.app.inject(`/chapters/${chapterId}/practice`)).statusCode).toBe(401);
    for (const role of ['admin', 'teacher', 'parent'] as const) {
      const { cookie } = h.roleCookie(DEMO_SCHOOL_ID, role);
      expect((await get(`/chapters/${chapterId}/practice`, cookie)).statusCode).toBe(403);
      expect((await get('/practice/streak', cookie)).statusCode).toBe(403);
      expect((await h.post('/practice/attempts', event(), cookie)).statusCode).toBe(403);
    }
    const registration = await h.register('other@example.test');
    const outsider = h.roleCookie(registration.json().school.id, 'student').cookie;
    expect((await get(`/chapters/${chapterId}/practice`, outsider)).statusCode).toBe(404);
    expect((await h.post('/practice/attempts', event(), outsider)).statusCode).toBe(404);
  });

  it('returns only released, section-scoped public items and validates game/query/input', async () => {
    const response = await get(`/chapters/${chapterId}/practice`);
    expect(response.statusCode).toBe(200);
    const set = PracticeSetSchema.parse(response.json());
    expect(set.items).toHaveLength(6);
    expect(set.required).toBe(false);
    expect(set.items.every(({ item }) => !('answer' in item))).toBe(true);
    expect((await get(`/chapters/${chapterId}/practice?gameId=match_the_concept`)).json().items).toEqual([]);
    expect((await get(`/chapters/${chapterId}/practice?gameId=other`)).statusCode).toBe(400);
    expect((await get(`/chapters/${chapterId}/practice?limit=31`)).statusCode).toBe(400);
    expect((await h.post('/practice/attempts', { ...event(), correct: true }, student)).statusCode).toBe(400);
    const db = h.database.db;
    db.update(assignments).set({ status: 'draft', publishedAt: null }).run();
    db.update(learningSessions).set({ releaseAt: h.now() + 1 }).run();
    expect((await get(`/chapters/${chapterId}/practice`)).json().items).toEqual([]);
    expect((await h.post('/practice/attempts', event(), student)).statusCode).toBe(404);
    const section = db.select().from(sections).get()!;
    const otherSection = randomUUID();
    db.insert(sections).values({ ...section, id: otherSection, name: 'B' }).run();
    db.update(learningSessions).set({ releaseAt: h.now(), sectionId: otherSection }).run();
    expect((await get(`/chapters/${chapterId}/practice`)).json().items).toEqual([]);
  });

  it('server-marks, updates mastery, retries exactly once and isolates profiles', async () => {
    const input = event();
    const first = await h.post('/practice/attempts', input, student);
    expect(first.statusCode).toBe(200);
    const marked = PracticeAttemptSchema.parse(first.json());
    expect(marked).toMatchObject({ correct: true, needsReview: false, assignmentId: null, profileId, conceptId });
    expect((await h.post('/practice/attempts', input, student)).json()).toEqual(marked);
    expect(h.database.db.select().from(attempts).all()).toHaveLength(1);
    expect(h.database.db.select().from(studentConceptStates).get()!.attempts).toBe(1);
    expect((await h.post('/practice/attempts', { ...input, timeMs: 51 }, student)).statusCode).toBe(409);
    const peer = h.roleCookie(DEMO_SCHOOL_ID, 'student');
    const sectionId = h.database.db.select().from(sections).get()!.id;
    h.database.db.update(profiles).set({ sectionId, rollNumber: '2' }).where(eq(profiles.id, peer.profileId)).run();
    expect((await h.post('/practice/attempts', input, peer.cookie)).statusCode).toBe(409);
    expect(StreakSchema.parse((await get('/practice/streak', peer.cookie)).json()).currentDays).toBe(0);
    const sync = await get('/sync?assignments=0&items=0&attempts=0&conceptStates=0');
    expect(sync.statusCode).toBe(200);
    const pulled = SyncResponseSchema.parse(sync.json());
    expect(pulled.attempts).toEqual([]);
    expect(pulled.conceptStates).toHaveLength(1);
  });

  it('wrong practice earns no streak and requires the existing remediation flow, including on retries', async () => {
    const input = event('No');
    const first = await h.post('/practice/attempts', input, student);
    expect(first.statusCode).toBe(200);
    expect(first.json().correct).toBe(false);
    expect((await get('/practice/streak')).json().currentDays).toBe(0);
    expect((await h.post('/practice/attempts', input, student)).json()).toEqual(first.json());
    const blocked = await h.post('/practice/attempts', event(), student);
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().code).toBe('REMEDIATION_REQUIRED');
  });

  it('counts correct answers once per local day, permits optional repeats and never alters deadlines', async () => {
    const dueAt = h.database.db.select().from(assignments).get()!.dueAt;
    expect((await get('/practice/streak')).json().currentDays).toBe(0);
    for (let i = 0; i < 2; i++) expect((await h.post('/practice/attempts', event(), student)).statusCode).toBe(200);
    expect((await get('/practice/streak')).json()).toMatchObject({ currentDays: 1, longestDays: 1 });
    h.advance(86400000);
    expect((await h.post('/practice/attempts', event(), student)).statusCode).toBe(200);
    expect((await get('/practice/streak')).json()).toMatchObject({ currentDays: 2, longestDays: 2 });
    expect(h.database.db.select().from(attempts).all()).toHaveLength(3);
    expect(h.database.db.select().from(assignments).get()!.dueAt).toBe(dueAt);
  });

  it('includes assignment answers and lesson/remediation evidence, not login or elapsed time', async () => {
    const assignmentId = h.database.db.select().from(assignments).get()!.id;
    expect((await h.post('/attempts', { ...event(), assignmentId }, student)).statusCode).toBe(200);
    const db = h.database.db;
    db.insert(learningEvidence).values({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, profileId, conceptId,
      source: 'remediation', correct: true, createdAt: h.now() - 86400000 }).run();
    db.insert(learningEvidence).values({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, profileId, conceptId,
      source: 'session', correct: false, createdAt: h.now() - 2 * 86400000 }).run();
    expect((await get('/practice/streak')).json()).toMatchObject({ currentDays: 2, longestDays: 2 });
  });

  it('mixes two new items with one due concept from an earlier week, with no cross-profile history', async () => {
    const db = h.database.db;
    db.insert(learningEvidence).values({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, profileId, conceptId,
      source: 'session', correct: true, createdAt: h.now() - 8 * 86400000 }).run();
    db.insert(studentConceptStates).values({ schoolId: DEMO_SCHOOL_ID, profileId, conceptId, mastery: 0.5,
      leitnerBox: 1, nextReview: h.now() - 1, attempts: 1, updatedAt: h.now() - 8 * 86400000 }).run();
    const set = PracticeSetSchema.parse((await get(`/chapters/${chapterId}/practice?limit=3`)).json());
    expect(set.items.map((row) => row.kind)).toEqual(['new', 'new', 'review']);
    expect(set.items[2]!.item.conceptId).toBe(conceptId);
  });
});
