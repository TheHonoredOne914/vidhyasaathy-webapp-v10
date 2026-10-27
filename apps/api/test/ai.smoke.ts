// Native runner exercises P5 without Vite subprocesses or a live provider key.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { AskResponseSchema, DraftJobSchema, LearningSessionSchema, RemediationSchema, RemediationResultSchema,
  StudyPlanSchema, type AiDraft, type Me } from '@vidhyasaathy/contracts';
import { selectPrerequisiteGap } from '@vidhyasaathy/core/remediation';
import { buildStudyPlan } from '@vidhyasaathy/core/study-plan';
import { eq } from 'drizzle-orm';
import { runDraftJob } from '../src/ai/jobs.ts';
import { LocalStubProvider, OpenAiProvider, type LlmProvider } from '../src/ai/provider.ts';
import { academicYears, classes, profiles, sections, subjects } from '../src/db/schema.ts';
import { cookieFrom, createHarness } from './helpers.ts';

test('P5: grounded hints, private scope, reviewed drafts, remediation gate and plan', async () => {
  let calls = 0;
  let generated: AiDraft;
  const provider: LlmProvider = { id: 'smoke', configured: true,
    ask: async (input) => { calls++; return { message: 'Which parts are equal?', sources: [{ chunkId: input.sources[0]!.id, quote: input.sources[0]!.text }] }; },
    draft: async () => generated };
  const h = await createHarness({ llmProvider: provider });
  try {
    const registration = await h.register();
    const admin = cookieFrom(registration.headers), schoolId = registration.json<Me>().school.id;
    const yearId = randomUUID(), classId = randomUUID(), sectionId = randomUUID(), subjectId = randomUUID();
    const db = h.database.db;
    db.insert(academicYears).values({ id: yearId, schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }).run();
    db.insert(classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(sections).values({ id: sectionId, schoolId, classId, name: 'A' }).run();
    db.insert(subjects).values({ id: subjectId, schoolId, classId, name: 'Maths' }).run();
    const student = h.roleCookie(schoolId, 'student');
    db.update(profiles).set({ sectionId, rollNumber: '1' }).where(eq(profiles.id, student.profileId)).run();
    const get = (url: string, cookie = student.cookie) => h.app.inject({ url, headers: { cookie } });
    const chapter = await h.post('/chapters', { subjectId, title: 'Fractions', position: 0 }, admin);
    assert.equal(chapter.statusCode, 201, chapter.body);
    const chapterId = chapter.json<{ id: string }>().id;
    const concept = await h.post(`/chapters/${chapterId}/concepts`, { title: 'Halves', description: '', prerequisiteIds: [] }, admin);
    assert.equal(concept.statusCode, 201, concept.body);
    const conceptId = concept.json<{ id: string }>().id;
    const body = 'Fractions divide a whole into equal parts. One half is one of two equal parts.';
    const note = await h.post(`/chapters/${chapterId}/notes`, { title: 'Fractions notes', body, conceptIds: [conceptId] }, admin);
    assert.equal(note.statusCode, 201, note.body);
    const noteId = note.json<{ id: string }>().id;
    const ask = (question = 'Explain fractions', hintLevel = 1, cookie = student.cookie) => h.post('/ask', { chapterId, question, hintLevel }, cookie);
    assert.equal((await ask()).json().status, 'not_in_notes');
    assert.equal((await h.post(`/notes/${noteId}/publish`, {}, admin)).statusCode, 200);
    assert.equal((await ask('Explain volcanoes')).json().status, 'not_in_notes');
    assert.equal((await ask('Explain fractions', 3)).statusCode, 409);
    const first = AskResponseSchema.parse((await ask()).json());
    assert.equal(first.status, 'answered');
    assert.equal(first.citations[0]!.noteId, noteId);
    assert.equal((await ask()).json().cached, true);
    assert.equal(calls, 1);
    assert.equal((await ask('Explain fractions', 2)).statusCode, 200);
    assert.equal((await ask('Explain fractions', 3)).statusCode, 200);
    for (const role of ['teacher', 'parent'] as const) assert.equal((await ask('Explain fractions', 1, h.roleCookie(schoolId, role).cookie)).statusCode, 403);
    assert.equal((await get('/ask')).statusCode, 404);
    const other = await h.register('other@example.test');
    assert.equal((await ask('Explain fractions', 1, h.roleCookie(other.json<Me>().school.id, 'student').cookie)).statusCode, 404);

    generated = { title: 'Practise halves', slides: [{ title: 'Equal parts', body, conceptId, noteId }], check: [
      { type: 'mcq', conceptId, prompt: 'How many equal parts make halves?', difficulty: 1, sourceRef: { noteId, locator: 'Text opening' }, options: ['two', 'three'], answer: 'two' },
      { type: 'mcq', conceptId, prompt: 'Are the parts equal?', difficulty: 1, sourceRef: { noteId, locator: 'Text opening' }, options: ['yes', 'no'], answer: 'yes' },
    ] };
    const queued = await h.post('/ai/draft-jobs', { noteId, sectionId }, admin);
    assert.equal(queued.statusCode, 202, queued.body);
    const jobId = DraftJobSchema.parse(queued.json()).id;
    assert.equal((await get(`/ai/draft-jobs/${jobId}`)).statusCode, 403);
    await runDraftJob(h.database, provider, h.now);
    assert.equal(DraftJobSchema.parse((await get(`/ai/draft-jobs/${jobId}`, admin)).json()).status, 'ready');
    const dueAt = h.now() + 3600000;
    const review = await h.post(`/ai/draft-jobs/${jobId}/review`, { decision: 'approve', draft: generated, dueAt }, admin);
    assert.equal(review.statusCode, 200, review.body);
    const approved = DraftJobSchema.parse(review.json());
    assert.equal((await get(`/sessions/${approved.sessionId}`)).statusCode, 403);
    assert.equal((await get(`/assignments/${approved.assignmentId}`)).statusCode, 403);
    assert.equal((await h.post(`/sessions/${approved.sessionId}/publish`, {}, admin)).statusCode, 200);
    const session = LearningSessionSchema.parse((await get(`/sessions/${approved.sessionId}`, admin)).json());
    assert.equal((await h.post(`/sessions/${session.id}/advance`, { slideId: session.slides[0]!.id }, student.cookie)).statusCode, 200);
    const failed = await h.post(`/sessions/${session.id}/check`, { answers: session.check.map((item, index) => ({ itemId: item.id, answer: index === 0 ? 'two' : 'no' })) }, student.cookie);
    assert.equal(failed.statusCode, 200, failed.body);
    let remediation = RemediationSchema.parse((await get(`/concepts/${conceptId}/remediation`)).json());
    assert.equal(remediation.status, 'ready');
    assert.equal(remediation.lesson!.body, body);
    assert.equal(remediation.check.length, 2);
    assert.equal(JSON.stringify(remediation.check).includes('"answer"'), false);
    const next = await h.post(`/chapters/${chapterId}/sessions`, { ...generated, sectionId }, admin);
    assert.equal(next.statusCode, 201, next.body);
    const nextSession = LearningSessionSchema.parse(next.json());
    assert.equal((await h.post(`/sessions/${nextSession.id}/publish`, {}, admin)).statusCode, 200);
    assert.equal((await h.post(`/sessions/${nextSession.id}/advance`, { slideId: nextSession.slides[0]!.id }, student.cookie)).json().code, 'REMEDIATION_REQUIRED');
    remediation = RemediationSchema.parse((await get(`/concepts/${conceptId}/remediation`)).json());
    const answers = remediation.check.map((item) => ({ itemId: item.id, answer: item.prompt.startsWith('How many') ? 'two' : 'yes' }));
    const firstCheck = await h.post(`/concepts/${conceptId}/remediation/check`, { clientEventId: randomUUID(), answers: remediation.check.map((item) => ({ itemId: item.id, answer: item.prompt.startsWith('How many') ? 'three' : 'no' })) }, student.cookie);
    assert.equal(firstCheck.statusCode, 200, firstCheck.body);
    assert.equal(RemediationResultSchema.parse(firstCheck.json()).passed, false);
    const event = { clientEventId: randomUUID(), answers };
    const secondCheck = await h.post(`/concepts/${conceptId}/remediation/check`, event, student.cookie);
    assert.equal(secondCheck.statusCode, 200, secondCheck.body);
    assert.equal(RemediationResultSchema.parse(secondCheck.json()).passedOnSecondAttempt, true);
    assert.deepEqual((await h.post(`/concepts/${conceptId}/remediation/check`, event, student.cookie)).json(), secondCheck.json());
    assert.equal((await h.post(`/sessions/${nextSession.id}/advance`, { slideId: nextSession.slides[0]!.id }, student.cookie)).statusCode, 200);
    const plan = StudyPlanSchema.parse((await get('/study-plan')).json());
    assert.equal(plan.continue?.id, nextSession.id);
    assert.equal(plan.continue.resumeAt, 1);
    assert.equal(plan.items.some((item) => item.id === approved.assignmentId), false);
    assert.deepEqual(h.database.sqlite.prepare('PRAGMA foreign_key_check').all(), []);
    h.database.sqlite.prepare("INSERT INTO note_chunk_fts(note_chunk_fts, rank) VALUES ('integrity-check', 1)").run();
  } finally { await h.app.close(); h.database.close(); }
});

test('P5: hosted adapter validates JSON, grounded refusal and safe transport errors', async (t) => {
  const provider = new OpenAiProvider({ apiKey: 'test-only', model: 'test-model', apiUrl: 'https://provider.example.test/completions' });
  const input = { question: 'Fractions?', hintLevel: 1, socratic: false, sources: [{ id: 1, noteId: randomUUID(), title: 'Note', position: 0, text: 'Equal parts.' }] };
  let output = JSON.stringify({ message: 'Which parts are equal?', sources: [{ chunkId: 1, quote: 'Equal parts.' }] });
  const fetch = t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    assert.equal((init.headers as Record<string, string>).authorization, 'Bearer test-only');
    assert.equal(JSON.parse(init.body as string).response_format.type, 'json_object');
    return new Response(JSON.stringify({ choices: [{ message: { content: output } }] }));
  });
  assert.equal((await provider.ask(input))!.sources[0]!.quote, 'Equal parts.');
  output = '{"refused":true}';
  assert.equal(await provider.ask(input), null);
  assert.equal(await provider.draft({ noteId: input.sources[0]!.noteId, title: 'Note', body: 'Equal parts.', concepts: [] }), null);
  output = '{"message":"unsupported"}';
  await assert.rejects(provider.ask(input));
  fetch.mock.mockImplementation(async () => new Response('private upstream detail', { status: 500 }));
  await assert.rejects(provider.ask(input), { message: 'AI provider request failed.' });
  fetch.mock.restore();
  assert.equal(await new LocalStubProvider().ask(), null);
});

test('P5: evidenced earliest prerequisite and deterministic due-today planning', () => {
  assert.equal(selectPrerequisiteGap('root', [
    { conceptId: 'early', depth: 2, evidence: 3, mastery: 0.2 },
    { conceptId: 'unknown', depth: 3, evidence: 2, mastery: 0 },
    { conceptId: 'near', depth: 1, evidence: 4, mastery: 0.1 },
  ]).targetConceptId, 'early');
  const now = Date.UTC(2026, 9, 24, 12);
  const plan = buildStudyPlan([
    { id: 'optional', chapterId: 'chapter', title: 'Remediation', kind: 'remediation', required: false, dueAt: null, resumeAt: 0 },
    { id: 'due', chapterId: 'chapter', title: 'Teacher work', kind: 'assignment', required: true, dueAt: now + 1000, resumeAt: 2 },
  ], now);
  assert.equal(plan.nextAction!.id, 'due');
  assert.equal(plan.continue!.resumeAt, 2);
  assert.equal(plan.items[0]!.dueAt, now + 1000);
});
