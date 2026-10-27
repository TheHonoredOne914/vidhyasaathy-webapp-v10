import { randomUUID } from 'node:crypto';
import { AssignmentDetailSchema, AssignmentSchema, AttemptSchema, BankItemSchema, PushAttemptsResponseSchema,
  SyncResponseSchema, type Me, type SaveItem, type SubmitAttempt, type SyncCursors } from '@vidhyasaathy/contracts';
import { acknowledge, enqueue } from '@vidhyasaathy/core/sync';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { academicYears, assignmentItems, assignments, attempts, chapters, classes, concepts, items, profiles,
  notes, sections, studentConceptStates, subjects, syncChanges, teacherAssignments } from '../src/db/schema.ts';
import { cookieFrom, createHarness, ORIGIN, type Harness } from './helpers.ts';

describe('assignments, attempts and differential sync', () => {
  let h: Harness;
  let schoolId: string;
  let sectionId: string;
  let otherSectionId: string;
  let chapterId: string;
  let conceptId: string;
  let subjectId: string;
  let admin: string;
  let teacher: string;
  let unassigned: string;
  let student: string;
  let studentId: string;
  let peer: string;
  let otherStudent: string;
  let parent: string;
  const get = (url: string, cookie = student) => h.app.inject({ url, headers: { cookie } });
  const put = (url: string, payload: Record<string, unknown>, cookie = teacher) => h.app.inject({
    method: 'PUT', url, payload, headers: { cookie, origin: ORIGIN },
  });
  const question = (): SaveItem => ({ conceptId, prompt: 'Choose one half', difficulty: 1, sourceRef: null,
    type: 'mcq', options: ['half', 'third'], answer: 'half' });
  async function createItem(content = question()) {
    const response = await h.post(`/chapters/${chapterId}/items`, content, teacher);
    expect(response.statusCode).toBe(201);
    return BankItemSchema.parse(response.json());
  }
  async function createAssignment(itemIds: string[], publish = true, section = sectionId, cookie = teacher) {
    const response = await h.post(`/chapters/${chapterId}/assignments`, {
      sectionId: section, title: 'Fractions homework', kind: 'homework', dueAt: h.now() + 1000, itemIds,
    }, cookie);
    expect(response.statusCode).toBe(201);
    const row = AssignmentDetailSchema.parse(response.json());
    if (publish) expect((await h.post(`/assignments/${row.id}/publish`, {}, cookie)).statusCode).toBe(200);
    return row;
  }
  const event = (assignmentId: string, itemId: string, answer: SubmitAttempt['answer'] = 'half'): SubmitAttempt => ({
    clientEventId: randomUUID(), assignmentId, itemId, answer, timeMs: 50, clientTs: h.now() - 100,
  });
  const syncUrl = (cursors: SyncCursors, limit = 100) => `/sync?${new URLSearchParams({
    ...Object.fromEntries(Object.entries(cursors).map(([key, value]) => [key, String(value)])), limit: String(limit),
  })}`;

  beforeEach(async () => {
    h = await createHarness();
    const registration = await h.register();
    admin = cookieFrom(registration.headers);
    schoolId = registration.json<Me>().school.id;
    const db = h.database.db;
    const yearId = randomUUID();
    const classId = randomUUID();
    sectionId = randomUUID(); otherSectionId = randomUUID(); subjectId = randomUUID();
    chapterId = randomUUID(); conceptId = randomUUID();
    db.insert(academicYears).values({ id: yearId, schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }).run();
    db.insert(classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(sections).values([{ id: sectionId, schoolId, classId, name: 'A' }, { id: otherSectionId, schoolId, classId, name: 'B' }]).run();
    db.insert(subjects).values({ id: subjectId, schoolId, classId, name: 'Maths' }).run();
    db.insert(chapters).values({ id: chapterId, schoolId, subjectId, title: 'Fractions', position: 0 }).run();
    db.insert(concepts).values({ id: conceptId, schoolId, chapterId, title: 'Halves', description: 'Equal parts' }).run();
    const assigned = h.roleCookie(schoolId, 'teacher');
    teacher = assigned.cookie;
    db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: assigned.profileId,
      sectionId, subjectId, classId }).run();
    unassigned = h.roleCookie(schoolId, 'teacher').cookie;
    const pupil = h.roleCookie(schoolId, 'student');
    student = pupil.cookie; studentId = pupil.profileId;
    const classmate = h.roleCookie(schoolId, 'student'); peer = classmate.cookie;
    const other = h.roleCookie(schoolId, 'student'); otherStudent = other.cookie;
    for (const [id, section, roll] of [[studentId, sectionId, '1'], [classmate.profileId, sectionId, '2'], [other.profileId, otherSectionId, '1']] as const) {
      db.update(profiles).set({ sectionId: section, rollNumber: roll }).where(eq(profiles.id, id)).run();
    }
    parent = h.roleCookie(schoolId, 'parent').cookie;
  });
  afterEach(async () => { if (h) await h.app.close(); });

  it('publishes required work with due dates, teacher identity and no answer keys', async () => {
    const item = await createItem();
    const row = await createAssignment([item.id], false);
    expect((await get('/assignments')).json()).toEqual([]);
    expect((await get(`/assignments/${row.id}`)).statusCode).toBe(403);
    expect(SyncResponseSchema.parse((await get('/sync')).json()).items).toEqual([]);
    const edit = await put(`/assignments/${row.id}`, { sectionId, title: 'Quiz on halves', kind: 'quiz', dueAt: h.now() + 2000, itemIds: [item.id] });
    expect(edit.statusCode).toBe(200);
    expect((await h.post(`/assignments/${row.id}/publish`, {}, teacher)).statusCode).toBe(200);
    const detail = AssignmentDetailSchema.parse((await get(`/assignments/${row.id}`)).json());
    expect(detail).toMatchObject({ kind: 'quiz', required: true, dueAt: h.now() + 2000, teacherName: 'Test profile',
      score: { status: 'not_started', answered: 0, total: 1 } });
    expect(detail.items[0]).toMatchObject({ type: 'mcq', options: ['half', 'third'] });
    expect(detail.items[0]).not.toHaveProperty('answer');
    expect(detail.items[0]).not.toHaveProperty('content');
    expect((await put(`/items/${item.id}`, question())).statusCode).toBe(409);
    expect((await put(`/assignments/${row.id}`, { sectionId, title: 'Changed', kind: 'quiz', dueAt: 0, itemIds: [item.id] })).statusCode).toBe(409);
  });

  it('reconnects an offline outbox exactly once and refuses event collisions or second answers', async () => {
    const item = await createItem(); const row = await createAssignment([item.id]);
    const input = event(row.id, item.id);
    const queue = enqueue([], input, h.now());
    const response = await h.post('/sync/attempts', { attempts: queue.map((entry) => entry.event) }, student);
    expect(response.statusCode).toBe(200);
    const accepted = PushAttemptsResponseSchema.parse(response.json());
    const changeCount = h.database.db.select().from(syncChanges).all().length;
    // The first acknowledgment was lost. Retrying must not change the score or mastery count.
    const replay = await h.post('/sync/attempts', { attempts: queue.map((entry) => entry.event) }, student);
    expect(replay.json()).toEqual(accepted);
    expect(acknowledge(queue, accepted.attempts.map((a) => a.clientEventId))).toEqual([]);
    expect(h.database.db.select().from(attempts).all()).toHaveLength(1);
    expect(h.database.db.select().from(studentConceptStates).get()).toMatchObject({ attempts: 1, mastery: 1, profileId: studentId });
    expect(h.database.db.select().from(syncChanges).all()).toHaveLength(changeCount);
    expect((await h.post('/attempts', { ...input, answer: 'third' }, student)).statusCode).toBe(409);
    expect((await h.post('/attempts', input, peer)).statusCode).toBe(409);
    expect((await h.post('/attempts', { ...input, clientEventId: randomUUID() }, student)).statusCode).toBe(409);
    expect(AssignmentSchema.parse((await get('/assignments')).json()[0]).score).toMatchObject({ status: 'completed', correct: 1 });
  });

  it('auto-marks each item format, queues unmatched prose and propagates teacher corrections', async () => {
    const base = { conceptId, prompt: 'Recall halves', difficulty: 1, sourceRef: null };
    const bank = await Promise.all([
      createItem(), createItem({ ...base, type: 'match_pairs', pairs: [{ left: '1/2', right: 'half' }, { left: '1/3', right: 'third' }] }),
      createItem({ ...base, type: 'short_answer', acceptedAnswers: ['one half'] }), createItem({ ...base, type: 'flashcard', answer: 'one half' }),
    ]);
    const row = await createAssignment(bank.map((item) => item.id));
    const answers = ['half', ['third', 'half'], 'two equal parts, one selected', ' ONE   HALF '] as const;
    const input = bank.map((item, index) => event(row.id, item.id, Array.isArray(answers[index]) ? [...answers[index]] : answers[index] as string));
    const response = await h.post('/sync/attempts', { attempts: input }, student);
    expect(response.statusCode).toBe(200);
    const marked = PushAttemptsResponseSchema.parse(response.json()).attempts;
    expect(marked.map((a) => a.correct)).toEqual([true, false, null, true]);
    expect(AssignmentDetailSchema.parse((await get(`/assignments/${row.id}`)).json()).score)
      .toMatchObject({ answered: 4, marked: 3, correct: 2, status: 'pending_review' });
    const pending = AttemptSchema.parse((await get('/attempts', teacher)).json()[0]);
    expect(pending).toMatchObject({ correct: null, needsReview: true });
    expect((await get('/attempts', unassigned)).json()).toEqual([]);
    expect((await h.post(`/attempts/${pending.id}/grade`, { correct: true }, unassigned)).statusCode).toBe(403);
    const firstSync = SyncResponseSchema.parse((await get('/sync')).json());
    expect((await h.post(`/attempts/${pending.id}/grade`, { correct: true }, teacher)).statusCode).toBe(200);
    const delta = SyncResponseSchema.parse((await get(syncUrl(firstSync.cursors))).json());
    expect(delta.attempts).toEqual([expect.objectContaining({ id: pending.id, correct: true, needsReview: false })]);
    expect(delta.conceptStates[0]).toMatchObject({ attempts: 4 });
    expect(delta.assignments[0]?.score).toMatchObject({ status: 'completed', correct: 3 });
    expect((await h.post(`/attempts/${pending.id}/grade`, { correct: false }, teacher)).statusCode).toBe(200);
    expect(h.database.db.select().from(studentConceptStates).get()?.attempts).toBe(4);
    expect((await get('/attempts', teacher)).json()).toEqual([]);
    expect((await get('/attempts?pendingOnly=false', teacher)).json()).toHaveLength(4);
    // Replaying the original pending event returns its current teacher grade.
    expect((await h.post('/attempts', input[2]!, student)).json()).toMatchObject({ id: pending.id, correct: false, needsReview: false });
  });

  it('paginates same-clock changes and receives late events without skipping or leaking peers', async () => {
    const bank = await Promise.all([createItem(), createItem(), createItem()]);
    const row = await createAssignment(bank.map((item) => item.id));
    let cursors: SyncCursors = { assignments: 0, items: 0, attempts: 0, conceptStates: 0 };
    const received = new Set<string>();
    for (let page = 0; page < 5; page++) {
      const delta = SyncResponseSchema.parse((await get(syncUrl(cursors, 1))).json());
      delta.items.forEach((item) => { received.add(item.id); expect(item).not.toHaveProperty('answer'); });
      cursors = delta.cursors;
      if (!Object.values(delta.hasMore).some(Boolean)) break;
    }
    expect([...received].sort()).toEqual(bank.map((item) => item.id).sort());
    expect((await h.post('/attempts', event(row.id, bank[0]!.id), peer)).statusCode).toBe(200);
    const peerDelta = SyncResponseSchema.parse((await get(syncUrl(cursors))).json());
    expect(peerDelta.attempts).toEqual([]); expect(peerDelta.conceptStates).toEqual([]); expect(peerDelta.assignments).toEqual([]);
    const input = { ...event(row.id, bank[0]!.id), clientTs: h.now() - 86400000 };
    expect((await h.post('/attempts', input, student)).statusCode).toBe(200);
    const delta = SyncResponseSchema.parse((await get(syncUrl(cursors))).json());
    expect(delta.attempts).toEqual([expect.objectContaining({ clientEventId: input.clientEventId, clientTs: input.clientTs, serverTs: h.now() })]);
    expect(delta.conceptStates[0]?.attempts).toBe(1);
    const empty = SyncResponseSchema.parse((await get(syncUrl(delta.cursors))).json());
    expect(empty.attempts).toEqual([]); expect(empty.items).toEqual([]); expect(empty.assignments).toEqual([]);
    expect((await get(`/assignments/${row.id}/attempts`)).json()).toHaveLength(1);
  });

  it('enforces school, role, section and subject scope on every assessment surface', async () => {
    const item = await createItem(); const row = await createAssignment([item.id]);
    const otherRow = await createAssignment([item.id], true, otherSectionId, admin);
    const foreign = cookieFrom((await h.register('other@example.test')).headers);
    for (const cookie of [parent, unassigned, otherStudent]) {
      expect((await get(`/assignments/${row.id}`, cookie)).statusCode).toBe(403);
    }
    expect((await get(`/assignments/${row.id}`, foreign)).statusCode).toBe(404);
    expect((await get(`/assignments/${otherRow.id}`, teacher)).statusCode).toBe(403);
    expect((await get('/assignments', teacher)).json()).toHaveLength(1);
    expect((await get('/assignments', admin)).json()).toHaveLength(2);
    expect((await get('/assignments', otherStudent)).json()).toEqual([expect.objectContaining({ id: otherRow.id })]);
    for (const cookie of [student, parent, unassigned]) {
      expect((await get(`/chapters/${chapterId}/items`, cookie)).statusCode).toBe(403);
      expect((await h.post(`/chapters/${chapterId}/items`, question(), cookie)).statusCode).toBe(403);
      expect((await h.post(`/assignments/${row.id}/publish`, {}, cookie)).statusCode).toBe(403);
    }
    for (const cookie of [teacher, admin, parent]) {
      expect((await h.post('/attempts', event(row.id, item.id), cookie)).statusCode).toBe(403);
      expect((await h.post('/sync/attempts', { attempts: [event(row.id, item.id)] }, cookie)).statusCode).toBe(403);
      expect((await get('/sync', cookie)).statusCode).toBe(403);
      expect((await get('/concept-states', cookie)).statusCode).toBe(403);
    }
    expect((await get('/attempts', student)).statusCode).toBe(403);
    expect((await get('/assignments', parent)).statusCode).toBe(403);
    expect((await h.post('/attempts', event(row.id, item.id), otherStudent)).statusCode).toBe(403);
    expect((await h.app.inject({ url: '/assignments' })).statusCode).toBe(401);
    expect((await h.app.inject({ method: 'POST', url: '/attempts', payload: event(row.id, item.id), headers: { cookie: student } })).statusCode).toBe(403);
    const foreignSubjectId = randomUUID(); const db = h.database.db;
    const subject = db.select().from(subjects).where(eq(subjects.id, subjectId)).get()!;
    db.insert(subjects).values({ id: foreignSubjectId, schoolId, classId: subject.classId, name: 'Science' }).run();
    const foreignChapterId = randomUUID();
    db.insert(chapters).values({ id: foreignChapterId, schoolId, subjectId: foreignSubjectId, title: 'Plants', position: 0 }).run();
    expect((await get(`/chapters/${foreignChapterId}/items`, teacher)).statusCode).toBe(403);
    expect((await get('/sync', otherStudent)).json()).toMatchObject({ attempts: [], conceptStates: [], assignments: [expect.objectContaining({ id: otherRow.id })] });
  });

  it('rejects forged marks, invalid formats and partial sync batches atomically', async () => {
    const item = await createItem(); const row = await createAssignment([item.id]);
    const input = event(row.id, item.id);
    for (const extra of [{ correct: true }, { profileId: studentId }, { conceptId }, { answer: ['half', 'third'] }, { answer: 'absent option' }]) {
      expect((await h.post('/attempts', { ...input, ...extra }, student)).statusCode).toBe(400);
    }
    expect((await h.post('/sync/attempts', { attempts: [input, { ...input, clientEventId: randomUUID(), itemId: randomUUID() }] }, student)).statusCode).toBe(404);
    expect(h.database.db.select().from(attempts).all()).toEqual([]);
    expect(h.database.db.select().from(studentConceptStates).all()).toEqual([]);
    for (const url of ['/sync?items=-1', '/sync?limit=201', '/sync?attempts=1.1']) expect((await get(url)).statusCode).toBe(400);
    const otherConcept = randomUUID(); const otherChapter = randomUUID();
    h.database.db.insert(chapters).values({ id: otherChapter, schoolId, subjectId, title: 'Other chapter', position: 1 }).run();
    h.database.db.insert(concepts).values({ id: otherConcept, schoolId, chapterId: otherChapter, title: 'Other concept', description: '' }).run();
    expect((await h.post(`/chapters/${chapterId}/items`, { ...question(), conceptId: otherConcept }, teacher)).statusCode).toBe(400);
    expect((await h.post(`/chapters/${chapterId}/assignments`, { sectionId, title: 'Bad items', kind: 'quiz', dueAt: 0, itemIds: [item.id, item.id] }, teacher)).statusCode).toBe(400);
    expect(h.database.db.select().from(assignments).all()).toHaveLength(1);
    expect(h.database.db.select().from(assignmentItems).all()).toHaveLength(1);
    expect(h.database.db.select().from(items).all()).toHaveLength(1);
  });

    it('requires referenced notes to be released before publishing an assignment', async () => {
      const noteId = randomUUID();
      h.database.db.insert(notes).values({ id: noteId, schoolId, chapterId, title: 'Halves', body: 'One of two equal parts.', updatedAt: h.now() }).run();
      const item = await createItem({ ...question(), sourceRef: { noteId, locator: 'Paragraph 1' } });
      const row = await createAssignment([item.id], false);
      expect((await h.post(`/assignments/${row.id}/publish`, {}, teacher)).statusCode).toBe(400);
      h.database.db.update(notes).set({ status: 'published', releaseAt: h.now() + 1000 }).where(eq(notes.id, noteId)).run();
      expect((await h.post(`/assignments/${row.id}/publish`, {}, teacher)).statusCode).toBe(400);
      expect((await get('/sync')).json().assignments).toEqual([]);
      h.advance(1000);
      expect((await h.post(`/assignments/${row.id}/publish`, {}, teacher)).statusCode).toBe(200);
    });

    it('accepts offline answers after the due date without changing the teacher deadline', async () => {
    const item = await createItem(); const row = await createAssignment([item.id]);
    const input = event(row.id, item.id);
    h.advance(2000);
    const response = await h.post('/attempts', input, student);
    expect(response.statusCode).toBe(200);
    expect(AttemptSchema.parse(response.json())).toMatchObject({ clientTs: input.clientTs, serverTs: h.now(), correct: true });
    expect(AssignmentDetailSchema.parse((await get(`/assignments/${row.id}`)).json()).dueAt).toBe(row.dueAt);
  });
});
