import { randomUUID } from 'node:crypto';
import { AskResponseSchema, ConceptGapSchema, DraftJobSchema, RemediationSchema, RemediationResultSchema, StudyPlanSchema,
  type AiDraft, type Me, type SaveItem } from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runDraftJob } from '../src/ai/jobs.ts';
import { LocalStubProvider, type GroundedQuestion, type LlmProvider } from '../src/ai/provider.ts';
import { retrieveGanitaManjari, retrieveNotes } from '../src/ai/retrieval.ts';
import { academicYears, assignments, chapters, classes, conceptPrereqs, concepts, items, learningEvidence, learningSessions,
  noteConcepts, notes, profiles, sections, studentConceptStates, subjects, teacherAssignments } from '../src/db/schema.ts';
import { cookieFrom, createHarness, type Harness } from './helpers.ts';

describe('grounded AI, approved drafts and remediation', () => {
  let h: Harness;
  let schoolId: string, chapterId: string, conceptId: string, noteId: string, sectionId: string;
  let admin: string, teacher: string, unassigned: string, student: string, studentId: string, parent: string;
  let provider: LlmProvider;
  const body = 'Fractions divide a whole into equal parts. One half is one of two equal parts.';
  const get = (url: string, cookie = student) => h.app.inject({ url, headers: { cookie } });
  const ask = (question = 'Explain fractions', extra: Record<string, unknown> = {}, cookie = student) => h.post('/ask', { chapterId, question, ...extra }, cookie);
  const question = (target = conceptId): SaveItem => ({ conceptId: target, prompt: 'Choose one half', difficulty: 1,
    sourceRef: { noteId, locator: 'Text opening' }, type: 'mcq', options: ['half', 'third'], answer: 'half' });
  const draft = (): AiDraft => ({ title: 'Fractions practice', slides: [{ title: 'Equal parts', body, conceptId, noteId }], check: [question(), question()] });
  const fail = () => h.database.db.insert(learningEvidence).values({ id: randomUUID(), schoolId, profileId: studentId,
    conceptId, correct: false, source: 'session', createdAt: h.now() }).run();

  beforeEach(async () => {
    provider = { id: 'test', configured: true, stream: new LocalStubProvider().stream, health: async () => true,
      ask: vi.fn(async (input: GroundedQuestion) => ({ message: 'Which parts are equal?', sources: [{ chunkId: input.sources[0]!.id, quote: input.sources[0]!.text }] })),
      draft: vi.fn(async () => draft()) };
    h = await createHarness({ llmProvider: provider });
    const registration = await h.register();
    admin = cookieFrom(registration.headers); schoolId = registration.json<Me>().school.id;
    const db = h.database.db;
    const yearId = randomUUID(), classId = randomUUID(), subjectId = randomUUID();
    sectionId = randomUUID(); chapterId = randomUUID(); conceptId = randomUUID(); noteId = randomUUID();
    db.insert(academicYears).values({ id: yearId, schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }).run();
    db.insert(classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(sections).values({ id: sectionId, schoolId, classId, name: 'A' }).run();
    db.insert(subjects).values({ id: subjectId, schoolId, classId, name: 'Maths' }).run();
    db.insert(chapters).values({ id: chapterId, schoolId, subjectId, title: 'Fractions', position: 0 }).run();
    db.insert(concepts).values({ id: conceptId, schoolId, chapterId, title: 'Halves', description: 'Equal parts' }).run();
    db.insert(notes).values({ id: noteId, schoolId, chapterId, title: 'Fractions notes', body, status: 'published', releaseAt: h.now(), updatedAt: h.now() }).run();
    db.insert(noteConcepts).values({ schoolId, chapterId, noteId, conceptId }).run();
    const assigned = h.roleCookie(schoolId, 'teacher'); teacher = assigned.cookie;
    db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: assigned.profileId, sectionId, subjectId, classId }).run();
    unassigned = h.roleCookie(schoolId, 'teacher').cookie;
    const pupil = h.roleCookie(schoolId, 'student'); student = pupil.cookie; studentId = pupil.profileId;
    db.update(profiles).set({ sectionId, rollNumber: '1' }).where(eq(profiles.id, studentId)).run();
    parent = h.roleCookie(schoolId, 'parent').cookie;
  });
  afterEach(async () => { await h.app.close(); });

  it('retrieves matching Ganita Manjari sections for the active chapter', () => {
    const sections = retrieveGanitaManjari('Coordinates', 'How do coordinates locate points on a graph?');
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.noteId).toMatch(/^ganita-manjari-/);
    expect(sections.every((section) => section.text.length > 0)).toBe(true);
    expect(retrieveGanitaManjari('Fractions', 'coordinates and graph')).toEqual([]);
  });

  it('refuses outside notes and excludes drafts, future releases and another school', async () => {
    expect(AskResponseSchema.parse((await ask('Explain volcanoes')).json()).status).toBe('not_in_notes');
    expect(provider.ask).not.toHaveBeenCalled();
    h.database.db.update(notes).set({ status: 'draft' }).where(eq(notes.id, noteId)).run();
    expect((await ask()).json().message).toContain('not in your notes');
    h.database.db.update(notes).set({ status: 'published', releaseAt: h.now() + 1 }).where(eq(notes.id, noteId)).run();
    expect((await ask()).json().status).toBe('not_in_notes');
    const other = await h.register('other@example.test');
    const outsider = h.roleCookie(other.json<Me>().school.id, 'student');
    expect((await ask('Explain fractions', {}, outsider.cookie)).statusCode).toBe(404);
    for (const cookie of [admin, teacher, parent]) expect((await ask('Explain fractions', {}, cookie)).statusCode).toBe(403);
    expect((await h.post('/ask', { chapterId, question: 'Explain fractions' })).statusCode).toBe(401);
  });

  it('indexes edits/deletes, scopes retrieval and preserves FTS integrity', () => {
    expect(retrieveNotes(h.database, schoolId, chapterId, 'fractions', h.now())).toHaveLength(1);
    h.database.db.update(notes).set({ body: 'Decimals express tenths.' }).where(eq(notes.id, noteId)).run();
    expect(retrieveNotes(h.database, schoolId, chapterId, 'fractions', h.now())).toEqual([]);
    expect(retrieveNotes(h.database, schoolId, chapterId, 'decimals', h.now())).toHaveLength(1);
    expect(retrieveNotes(h.database, randomUUID(), chapterId, 'decimals', h.now())).toEqual([]);
    expect(retrieveNotes(h.database, schoolId, randomUUID(), 'decimals', h.now())).toEqual([]);
    h.database.db.delete(noteConcepts).where(eq(noteConcepts.noteId, noteId)).run();
    h.database.db.delete(notes).where(eq(notes.id, noteId)).run();
    expect(retrieveNotes(h.database, schoolId, chapterId, 'decimals', h.now())).toEqual([]);
    expect(h.database.sqlite.pragma('foreign_key_check')).toEqual([]);
    h.database.sqlite.prepare("INSERT INTO note_chunk_fts(note_chunk_fts) VALUES ('integrity-check')").run();
  });

  it('requires earlier hints per profile, caches grounded answers and keeps chats private', async () => {
    expect((await ask('Explain fractions', { hintLevel: 2 })).statusCode).toBe(409);
    const first = AskResponseSchema.parse((await ask()).json());
    expect(first).toMatchObject({ status: 'answered', hintLevel: 1, cached: false, citations: [{ noteId, quote: body }] });
    expect((await ask()).json().cached).toBe(true);
    expect(provider.ask).toHaveBeenCalledTimes(1);
    expect((await ask('Explain fractions', { hintLevel: 2 })).json().status).toBe('answered');
    expect((await ask('Explain fractions', { hintLevel: 2, socratic: true })).statusCode).toBe(409);
    const peer = h.roleCookie(schoolId, 'student');
    h.database.db.update(profiles).set({ sectionId, rollNumber: '2' }).where(eq(profiles.id, peer.profileId)).run();
    expect((await ask('Explain fractions', { hintLevel: 2 }, peer.cookie)).statusCode).toBe(409);
    expect((await get('/doubts', parent)).statusCode).toBe(404);
    expect((await get('/doubts', teacher)).statusCode).toBe(404);
  });

  it('fails closed for provider errors and fabricated citations', async () => {
    vi.mocked(provider.ask).mockResolvedValueOnce({ message: 'Unsupported answer', sources: [{ chunkId: 9999, quote: 'Invented' }] })
      .mockRejectedValueOnce(new Error('secret upstream response'));
    expect((await ask()).json()).toMatchObject({ status: 'unavailable', citations: [] });
    const response = await ask();
    expect(response.json().status).toBe('unavailable');
    expect(response.body).not.toContain('secret');
    expect((await ask()).json().status).toBe('answered');
  });

  it('uses a per-profile AI rate limit', async () => {
    for (let index = 0; index < 10; index++) expect((await ask()).statusCode).toBe(200);
    expect((await ask()).statusCode).toBe(429);
    const peer = h.roleCookie(schoolId, 'student');
    h.database.db.update(profiles).set({ sectionId, rollNumber: '2' }).where(eq(profiles.id, peer.profileId)).run();
    expect((await ask('Explain fractions', {}, peer.cookie)).statusCode).toBe(200);
  });

  it('queues drafts, isolates review and keeps approved content unpublished until released', async () => {
    for (const cookie of [student, parent, unassigned]) {
      expect((await h.post('/ai/draft-jobs', { noteId, sectionId }, cookie)).statusCode).toBe(403);
    }
    const created = await h.post('/ai/draft-jobs', { noteId, sectionId }, teacher);
    expect(created.statusCode).toBe(202);
    const job = DraftJobSchema.parse(created.json());
    expect(job.status).toBe('queued');
    await runDraftJob(h.database, provider, h.now);
    const ready = DraftJobSchema.parse((await get(`/ai/draft-jobs/${job.id}`, teacher)).json());
    expect(ready.status).toBe('ready');
    expect((await get(`/ai/draft-jobs/${job.id}`, student)).statusCode).toBe(403);
    expect((await get(`/ai/draft-jobs/${job.id}`, unassigned)).statusCode).toBe(403);
    expect((await get(`/chapters/${chapterId}/sessions`)).json()).toEqual([]);
    const approved = await h.post(`/ai/draft-jobs/${job.id}/review`, { decision: 'approve', draft: ready.draft, dueAt: h.now() + 1000 }, teacher);
    expect(approved.statusCode).toBe(200);
    const result = DraftJobSchema.parse(approved.json());
    expect(result.status).toBe('approved');
    expect(h.database.db.select().from(assignments).get()).toMatchObject({ id: result.assignmentId, status: 'draft', dueAt: h.now() + 1000 });
    expect((await get(`/sessions/${result.sessionId}`)).statusCode).toBe(403);
    expect((await get(`/assignments/${result.assignmentId}`)).statusCode).toBe(403);
    expect((await h.post(`/ai/draft-jobs/${job.id}/review`, { decision: 'reject' }, admin)).statusCode).toBe(409);
  });

  it('labels the local stub and rejects stale or ungrounded drafts', async () => {
    const created = await h.post('/ai/draft-jobs', { noteId, sectionId }, teacher);
    const id = created.json().id as string;
    await runDraftJob(h.database, new LocalStubProvider(), h.now);
    expect((await get(`/ai/draft-jobs/${id}`, teacher)).json()).toMatchObject({ status: 'not_configured', message: 'AI not configured' });
    const next = await h.post('/ai/draft-jobs', { noteId, sectionId }, teacher);
    vi.mocked(provider.draft).mockResolvedValueOnce({ ...draft(), check: [{ ...question(), sourceRef: null }, question()] });
    await runDraftJob(h.database, provider, h.now);
    expect((await get(`/ai/draft-jobs/${next.json().id}`, teacher)).json().status).toBe('failed');
    const stale = await h.post('/ai/draft-jobs', { noteId, sectionId }, teacher);
    await runDraftJob(h.database, provider, h.now);
    h.database.db.update(notes).set({ body: 'Changed note' }).where(eq(notes.id, noteId)).run();
    expect((await h.post(`/ai/draft-jobs/${stale.json().id}/review`, { decision: 'approve', draft: draft(), dueAt: h.now() }, teacher)).statusCode).toBe(409);
  });

  it('finds the earliest evidenced weak prerequisite and offers a short lesson plus two questions', async () => {
    const prereq = randomUUID(), earliest = randomUUID();
    h.database.db.insert(concepts).values([prereq, earliest].map((id) => ({ id, schoolId, chapterId, title: 'Equal parts', description: '' }))).run();
    h.database.db.insert(conceptPrereqs).values([{ schoolId, conceptId, prereqId: prereq }, { schoolId, conceptId: prereq, prereqId: earliest }]).run();
    for (const [id, evidence] of [[prereq, 3], [earliest, 2]] as const) h.database.db.insert(studentConceptStates).values({ schoolId, profileId: studentId,
      conceptId: id, mastery: 0.2, leitnerBox: 1, nextReview: h.now(), attempts: evidence, updatedAt: h.now() }).run();
    expect(ConceptGapSchema.parse((await get(`/concepts/${conceptId}/gap`)).json())).toMatchObject({ targetConceptId: prereq, depth: 1, evidence: 3 });
    h.database.db.update(studentConceptStates).set({ attempts: 3 }).where(eq(studentConceptStates.conceptId, earliest)).run();
    expect((await get(`/concepts/${conceptId}/gap`)).json().targetConceptId).toBe(earliest);
    h.database.db.insert(noteConcepts).values({ schoolId, chapterId, noteId, conceptId: earliest }).run();
    const sessionId = randomUUID();
    h.database.db.insert(learningSessions).values({ id: sessionId, schoolId, chapterId, sectionId, title: 'Practice', status: 'published', releaseAt: h.now(), updatedAt: h.now() }).run();
    const questions = [0, 1].map((position) => ({ id: randomUUID(), schoolId, chapterId, sessionId, conceptId: earliest, position, content: question(earliest) }));
    h.database.db.insert(items).values(questions).run();
    fail();
    const lesson = RemediationSchema.parse((await get(`/concepts/${conceptId}/remediation`)).json());
    expect(lesson).toMatchObject({ status: 'ready', targetConceptId: earliest, lesson: { body, citation: { noteId } } });
    expect(lesson.check).toHaveLength(2);
    expect(lesson.check[0]).not.toHaveProperty('answer');
    const answers = (value: string) => lesson.check.map((item) => ({ itemId: item.id, answer: value }));
    const first = await h.post(`/concepts/${conceptId}/remediation/check`, { clientEventId: randomUUID(), answers: answers('third') }, student);
    expect(RemediationResultSchema.parse(first.json())).toMatchObject({ passed: false, checkAttempt: 1 });
    const input = { clientEventId: randomUUID(), answers: answers('half') };
    const second = await h.post(`/concepts/${conceptId}/remediation/check`, input, student);
    expect(RemediationResultSchema.parse(second.json())).toMatchObject({ passed: true, checkAttempt: 2, passedOnSecondAttempt: true });
    expect((await h.post(`/concepts/${conceptId}/remediation/check`, input, student)).json()).toEqual(second.json());
    expect((await h.post(`/concepts/${conceptId}/remediation/check`, { ...input, answers: answers('third') }, student)).statusCode).toBe(409);
    expect((await get(`/concepts/${conceptId}/remediation`)).json().status).toBe('passed');
    for (const cookie of [teacher, admin, parent]) expect((await get(`/concepts/${conceptId}/gap`, cookie)).statusCode).toBe(403);
  });

  it('does not invent missing remediation material or expose draft questions', async () => {
    fail();
    expect((await get(`/concepts/${conceptId}/remediation`)).json()).toMatchObject({ status: 'needs_teacher_material', check: [], lesson: null });
    const sessionId = randomUUID();
    h.database.db.insert(learningSessions).values({ id: sessionId, schoolId, chapterId, sectionId, title: 'Unapproved', updatedAt: h.now() }).run();
    h.database.db.insert(items).values([0, 1].map((position) => ({ id: randomUUID(), schoolId, chapterId, sessionId, conceptId, position, content: question() }))).run();
    expect((await get(`/concepts/${conceptId}/remediation`)).json().status).toBe('needs_teacher_material');
  });

  it('keeps required deadlines and resumes the same slide in a scoped study plan', async () => {
    const job = (await h.post('/ai/draft-jobs', { noteId, sectionId }, teacher)).json();
    await runDraftJob(h.database, provider, h.now);
    const approved = (await h.post(`/ai/draft-jobs/${job.id}/review`, { decision: 'approve', draft: draft(), dueAt: h.now() }, teacher)).json();
    expect((await h.post(`/assignments/${approved.assignmentId}/publish`, {}, teacher)).statusCode).toBe(200);
    expect((await h.post(`/sessions/${approved.sessionId}/publish`, { releaseAt: h.now() }, teacher)).statusCode).toBe(200);
    const plan = StudyPlanSchema.parse((await get('/study-plan')).json());
    expect(plan.nextAction).toMatchObject({ id: approved.assignmentId, dueAt: h.now(), required: true });
    expect(plan.items.find((item) => item.id === approved.sessionId)).toMatchObject({ kind: 'session', resumeAt: 0 });
    for (const cookie of [teacher, parent, admin]) expect((await get('/study-plan', cookie)).statusCode).toBe(403);
  });
});

it('serves a clearly labelled unconfigured doubt resolver', async () => {
  const stub = new LocalStubProvider();
  expect(stub.configured).toBe(false);
  expect(await stub.ask()).toBeNull();
  expect(await stub.draft()).toBeNull();
});
