import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { LearningPreferencesSchema, NotebookProgressSchema, SubjectPathSchema, SubjectsBoardSchema } from '@vidhyasaathy/contracts';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { answerEvidence, chapters, conceptLadders, concepts, items, parentLinks, profiles, teacherAssignments } from '../src/db/schema.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';
import { notebookWorld, subjectPath } from '../src/notebook/views.ts';

describe('notebook learning preferences', () => {
  let h: Harness;
  let cookie: string;
  let otherCookie: string;
  let schoolId: string;
  beforeAll(async () => {
    h = await createHarness();
    schoolId = (await h.register()).json().school.id;
    cookie = (await h.roleCookie(schoolId, 'student')).cookie;
    otherCookie = (await h.roleCookie(schoolId, 'student')).cookie;
  });
  afterAll(async () => { await h.app.close(); h.database.close(); });

  it('defaults, validates and persists only the current profile preferences', async () => {
    const read = (who: string) => h.app.inject({ url: '/student/settings', headers: { cookie: who } });
    const defaults = LearningPreferencesSchema.parse({});
    expect((await read(cookie)).json()).toEqual(defaults);
    const preferences = { ...defaults, style: 'diagram', whenStuck: 'example', reminder: '18:30', biggerText: true, language: 'hi' };
    const saved = await h.app.inject({ method: 'PUT', url: '/student/settings', payload: preferences,
      headers: { cookie, origin: 'https://school.test' } });
    expect(saved.statusCode).toBe(200);
    expect((await read(cookie)).json()).toEqual(preferences);
    expect((await read(otherCookie)).json()).toEqual(defaults);
    const invalid = await h.app.inject({ method: 'PUT', url: '/student/settings', payload: { dailyGoalMinutes: 0 },
      headers: { cookie, origin: 'https://school.test' } });
    expect(invalid.statusCode).toBe(400);
  });

  it('rejects non-students and unauthenticated requests', async () => {
    expect((await h.app.inject({ url: '/student/settings' })).statusCode).toBe(401);
    for (const role of ['teacher', 'parent', 'admin'] as const) {
      const who = (await h.roleCookie(schoolId, role)).cookie;
      for (const method of ['GET', 'PUT'] as const) {
        const response = await h.app.inject({ method, url: '/student/settings',
          ...(method === 'PUT' ? { payload: {} } : {}), headers: { cookie: who, origin: 'https://school.test' } });
        expect(response.statusCode).toBe(403);
      }
    }
  });
});

describe('school-scoped notebook read models', () => {
  let h: Harness;
  let aarav: string;
  let priya: string;
  let childId: string;
  let teacher: string;
  let parent: string;
  const get = (url: string, cookie: string) => h.app.inject({ url, headers: { cookie } });
  beforeAll(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
    for (const name of ['Aarav', 'Priya']) {
      const pupil = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, name))).get()!;
      const cookie = cookieFrom((await h.post('/auth/pin-login', { profileId: pupil.id, pin: PIN })).headers);
      if (name === 'Aarav') { aarav = cookie; childId = pupil.id; } else priya = cookie;
    }
    const parentRole = h.roleCookie(DEMO_SCHOOL_ID, 'parent');
    parent = parentRole.cookie;
    h.database.db.insert(parentLinks).values({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID,
      parentProfileId: parentRole.profileId, studentProfileId: childId }).run();
    const teacherRole = h.roleCookie(DEMO_SCHOOL_ID, 'teacher');
    teacher = teacherRole.cookie;
    const assigned = h.database.db.select().from(teacherAssignments).where(eq(teacherAssignments.schoolId, DEMO_SCHOOL_ID)).all();
    h.database.db.insert(teacherAssignments).values(assigned.map((row) => ({ ...row, id: randomUUID(), teacherProfileId: teacherRole.profileId }))).run();
  });
  afterAll(async () => { await h.app.close(); h.database.close(); });
  const enroll = (profileId: string) => {
    const sectionId = h.database.db.select().from(profiles).where(eq(profiles.id, childId)).get()!.sectionId;
    h.database.db.update(profiles).set({ sectionId, rollNumber: `T-${profileId.slice(0, 8)}` }).where(eq(profiles.id, profileId)).run();
  };

  it('derives ordered stations, goals, real time and confidence from each pupil', async () => {
    const board = SubjectsBoardSchema.parse((await get('/student/subjects-board', aarav)).json());
    const weaker = SubjectsBoardSchema.parse((await get('/student/subjects-board', priya)).json());
    expect(board.subjects.length).toBeGreaterThan(0);
    expect(board).not.toEqual(weaker);
    const path = SubjectPathSchema.parse((await get(`/student/subjects/${board.subjects[0]!.subjectId}/path`, aarav)).json());
    expect(path.chapters.every((chapter) => chapter.goal.total === chapter.stations.length)).toBe(true);
    expect(path.chapters.every((chapter) => chapter.atAGlance.reduce((n, row) => n + row.count, 0) === chapter.goal.total)).toBe(true);
    const progress = NotebookProgressSchema.parse((await get('/student/progress', aarav)).json());
    expect(progress.week).toHaveLength(7);
    expect(progress.calendar.some((day) => day.studied)).toBe(true);
    expect(progress.confidence.some((row) => row.answers > 0)).toBe(true);
    for (const response of [board, path, progress]) {
      expect(JSON.stringify(response)).not.toMatch(/"(?:answerKey|correctOption|ladderLevel|masteryLevel|band|rank|leaderboard|level)":/i);
    }
    expect((await get(`/student/subjects/${randomUUID()}/path`, aarav)).statusCode).toBe(404);
  });

  it('returns linked parent summaries and assigned teacher aggregates without chats or draft keys', async () => {
    const home = await get(`/parents/children/${childId}/home`, parent);
    expect(home.statusCode).toBe(200);
    expect(home.json()).toMatchObject({ homework: { done: expect.any(Number), total: expect.any(Number) }, subjects: expect.any(Array), gotIt: expect.any(Array) });
    expect(home.body).not.toMatch(/"(?:chat|messages|answerKey|masteryLevel|band|rank|level)":/i);
    const dashboard = await get('/teacher/home', teacher);
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.json().kpis.studiedThisWeek.total).toBeGreaterThanOrEqual(5);
    expect(dashboard.json().heatTable.length).toBeGreaterThan(0);
    expect(dashboard.json().reviewQueue.length).toBeGreaterThan(0);
    expect(dashboard.json().reviewQueue.every((job: { status: string }) => ['ready', 'failed', 'not_configured'].includes(job.status))).toBe(true);
    expect(dashboard.body).not.toMatch(/"(?:draft|answerKey|correctOption)":/);
    const unrelated = h.roleCookie(DEMO_SCHOOL_ID, 'parent').cookie;
    expect((await get(`/parents/children/${childId}/home`, unrelated)).statusCode).toBe(403);
    const unassigned = h.roleCookie(DEMO_SCHOOL_ID, 'teacher').cookie;
    expect((await get('/teacher/home', unassigned)).json()).toMatchObject({ heatTable: [], reviewQueue: [], nudges: [] });
  });

  it('skips empty chapters but never skips an unfinished chapter in path locks', () => {
    const pupil = h.database.db.select().from(profiles).where(eq(profiles.id, childId)).get()!;
    const world = notebookWorld(h.database.db, DEMO_SCHOOL_ID, pupil, h.now());
    const chapter = world.chapterRows[0]!;
    const concept = world.conceptRows.find((row) => row.chapterId === chapter.id)!;
    const chapterRows = ['Empty', 'First idea', 'Already mastered', 'Later idea'].map((title, position) =>
      ({ ...chapter, id: randomUUID(), title, position }));
    const conceptRows = chapterRows.slice(1).map((row) => ({ ...concept, id: randomUUID(), chapterId: row.id }));
    const mastered = conceptRows[1]!.id;
    const path = subjectPath({ ...world, chapterRows, conceptRows, allConcepts: conceptRows, edges: [],
      mastery: (id) => id === mastered ? 3 : null, done: (id) => id === mastered,
      word: (id) => id === mastered ? 'Mastered' : 'New' }, chapter.subjectId);
    expect(path.chapters[1]!.lockReason).toBeNull();
    expect(path.chapters[2]!.stations[0]).toMatchObject({ status: 'done', lockReason: null });
    expect(path.chapters[3]!.lockReason).toBe('Finish First idea first.');
    expect(path.chapters[3]!.stations[0]!.status).toBe('locked');
  });

  it('provides key-free lesson tabs and a no-penalty prerequisite diagnostic', async () => {
    const chapter = h.database.db.select().from(chapters).where(and(eq(chapters.schoolId, DEMO_SCHOOL_ID), eq(chapters.title, 'Motion'))).get()!;
    const idea = h.database.db.select().from(concepts).where(and(eq(concepts.chapterId, chapter.id), eq(concepts.title, 'Distance & Displacement'))).get()!;
    const lesson = await get(`/concepts/${idea.id}/notebook-lesson`, aarav);
    expect(lesson.statusCode).toBe(200);
    expect(Object.keys(lesson.json().styles)).toEqual(['notes', 'story', 'diagram', 'exam']);
    expect(lesson.json().video).toBeNull();
    expect(lesson.json().priorClassBridge.sourceClass).toBeLessThan(9);
    expect(lesson.body).not.toMatch(/"(?:answer|answers|correctOption|masteryLevel|level)":/);
    const pupil = h.roleCookie(DEMO_SCHOOL_ID, 'student');
    enroll(pupil.profileId);
    const url = `/chapters/${chapter.id}/notebook-diagnostic`;
    const offer = (await get(url, pupil.cookie)).json();
    expect(offer.offered).toBe(true);
    expect(offer.questions.length).toBeGreaterThanOrEqual(5);
    expect(offer.questions.every((q: { sourceClass: number; options: string[] }) => q.sourceClass >= 6 && q.sourceClass < 9
      && q.options.includes("Haven't learned this yet"))).toBe(true);
    expect(JSON.stringify(offer)).not.toMatch(/"(?:answer|correctOption|level)":/);
    const submitted = await h.post(`/chapters/${chapter.id}/diagnostic`, {
      answers: offer.questions.map((q: { id: string }) => ({ itemId: q.id, answer: "Haven't learned this yet", confidence: 'unsure' })),
    }, pupil.cookie);
    expect(submitted.statusCode).toBe(200);
    expect(submitted.json().word).toBe('New');
    expect((await get(url, pupil.cookie)).json().soFar).toEqual({ answered: offer.questions.length,
      total: offer.questions.length, gotIt: 0, workingOn: 0, notTaught: offer.questions.length });
    expect(h.database.db.select().from(conceptLadders).where(eq(conceptLadders.profileId, pupil.profileId)).all()
      .every((row) => row.masteryLevel === null)).toBe(true);
    for (const endpoint of [url, `/concepts/${idea.id}/notebook-lesson`]) {
      expect((await get(endpoint, teacher)).statusCode).toBe(403);
      expect((await get(endpoint, parent)).statusCode).toBe(403);
    }
  });

  it('persists a server-owned quiz strip and records a retried answer only once', async () => {
    const chapter = h.database.db.select().from(chapters).where(and(eq(chapters.schoolId, DEMO_SCHOOL_ID), eq(chapters.title, 'Motion'))).get()!;
    const pupil = h.roleCookie(DEMO_SCHOOL_ID, 'student');
    enroll(pupil.profileId);
    const start = await h.post(`/chapters/${chapter.id}/quiz-rounds`, { limit: 2 }, pupil.cookie);
    expect(start.statusCode).toBe(200);
    const round = start.json();
    expect(round.strip.map((row: { state: string }) => row.state)).toEqual(['current', 'next']);
    expect(start.body).not.toMatch(/"(?:answer|correctOption|masteryLevel|level)":/);
    const url = `/quiz-rounds/${round.id}`;
    expect((await get(url, aarav)).statusCode).toBe(404);
    expect((await get(url, teacher)).statusCode).toBe(403);
    expect((await h.post(`/chapters/${chapter.id}/quiz-rounds`, {}, parent)).statusCode).toBe(403);
    const content = h.database.db.select().from(items).where(eq(items.id, round.item.id)).get()!.content;
    if (content.type !== 'mcq') throw new Error('Expected a seeded NCERT MCQ');
    const input = { clientEventId: randomUUID(), itemId: round.item.id, answer: content.answer, timeMs: 18000,
      clientTs: h.now(), confidence: 'sure' };
    expect((await h.post(`${url}/answer`, { ...input, itemId: round.strip[1].itemId }, pupil.cookie)).statusCode).toBe(409);
    const saved = await h.post(`${url}/answer`, input, pupil.cookie);
    expect(saved.statusCode).toBe(200);
    expect(saved.json()).toMatchObject({ round: { answered: 1, correct: 1 }, answer: { repeatedError: false } });
    expect((await h.post(`${url}/answer`, input, pupil.cookie)).json()).toEqual(saved.json());
    expect(h.database.db.select().from(answerEvidence).where(eq(answerEvidence.id, `practice:${input.clientEventId}`)).all()).toHaveLength(1);
    expect((await get(url, pupil.cookie)).json().strip[0].state).toBe('correct');
  });

  it('lists only the existing games, keeps the approved Atom Forge available, and enforces roles', async () => {
    const games = await get('/student/games', aarav);
    expect(games.statusCode).toBe(200);
    expect(games.json().atomForge).toEqual({ status: 'ready', label: 'Enter the atom', href: '/student/games/atom' });
    expect(games.json().todaysGame).toBeNull(); // This school's fixture has no game checkpoint bank.
    for (const url of ['/student/subjects-board', '/student/progress', '/student/games']) {
      expect((await h.app.inject({ url })).statusCode).toBe(401);
      for (const cookie of [teacher, parent]) expect((await get(url, cookie)).statusCode).toBe(403);
    }
    expect((await get('/teacher/home', aarav)).statusCode).toBe(403);
    expect((await get(`/parents/children/${childId}/home`, teacher)).statusCode).toBe(403);
    const otherSchool = (await h.register('other-notebook@example.test')).json().school.id;
    const outsider = h.roleCookie(otherSchool, 'parent').cookie;
    expect((await get(`/parents/children/${childId}/home`, outsider)).statusCode).toBe(403);
  });
});
