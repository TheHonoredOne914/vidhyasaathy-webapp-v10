// Native Node runner keeps the critical acceptance flow runnable without Vite subprocesses.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { LearningSessionSchema, PublicItemSchema, type Me } from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import { academicYears, classes, profiles, sections, subjects } from '../src/db/schema.ts';
import { cookieFrom, createHarness } from './helpers.ts';

test('P3: scheduled content, authenticated files, sequential slides and a required check', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vs-p3-smoke-'));
  const h = await createHarness({ uploadsDirectory: directory });
  try {
    const registration = await h.register();
    const admin = cookieFrom(registration.headers);
    const schoolId = registration.json<Me>().school.id;
    const yearId = randomUUID();
    const classId = randomUUID();
    const sectionId = randomUUID();
    const subjectId = randomUUID();
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
    const note = await h.post(`/chapters/${chapterId}/notes`, { title: 'Halves', body: 'Two equal parts.', conceptIds: [conceptId] }, admin);
    assert.equal(note.statusCode, 201, note.body);
    const noteId = note.json<{ id: string }>().id;
    assert.equal((await h.post(`/notes/${noteId}/file`, { filename: 'note.txt', contentType: 'text/plain', dataBase64: 'bm90ZQ==' }, admin)).statusCode, 200);
    assert.equal((await get(`/notes/${noteId}/file`)).statusCode, 403);
    const releaseAt = h.now() + 1000;
    assert.equal((await h.post(`/notes/${noteId}/publish`, { releaseAt }, admin)).statusCode, 200);
    const sessionResponse = await h.post(`/chapters/${chapterId}/sessions`, {
      sectionId, title: 'Study halves',
      slides: ['First', 'Last hidden slide'].map((body) => ({ conceptId, title: body, body, noteId })),
      check: [{ conceptId, prompt: 'How many equal parts?', difficulty: 1, sourceRef: { noteId, locator: 'Paragraph 1' }, type: 'mcq', options: ['two', 'three'], answer: 'two' }],
    }, admin);
    assert.equal(sessionResponse.statusCode, 201, sessionResponse.body);
    const session = LearningSessionSchema.parse(sessionResponse.json());
    assert.equal((await h.post(`/sessions/${session.id}/publish`, { releaseAt }, admin)).statusCode, 200);
    assert.equal((await get(`/sessions/${session.id}`)).statusCode, 403);
    assert.deepEqual((await get(`/chapters/${chapterId}/sessions`)).json(), []);
    h.advance(1000);
    assert.equal((await get(`/notes/${noteId}/file`)).body, 'note');
    const first = await get(`/sessions/${session.id}`);
    assert.equal(first.statusCode, 200, first.body);
    assert.equal(first.body.includes('Last hidden slide'), false);
    assert.equal((await h.post(`/sessions/${session.id}/advance`, { slideId: session.slides[1]!.id }, student.cookie)).statusCode, 403);
    const answers = [{ itemId: session.check[0]!.id, answer: 'three' }];
    assert.equal((await h.post(`/sessions/${session.id}/check`, { answers }, student.cookie)).statusCode, 403);
    for (const slide of session.slides) assert.equal((await h.post(`/sessions/${session.id}/advance`, { slideId: slide.id }, student.cookie)).statusCode, 200);
    const ready = LearningSessionSchema.parse((await get(`/sessions/${session.id}`)).json());
    assert.equal(ready.progress!.completed, false);
    assert.equal(PublicItemSchema.safeParse(ready.check[0]).success, true);
    const done = await h.post(`/sessions/${session.id}/check`, { answers }, student.cookie);
    assert.equal(done.statusCode, 200, done.body);
    assert.equal(LearningSessionSchema.parse(done.json()).progress!.completed, true);
    assert.equal((await get(`/chapters/${chapterId}`)).json<{ status: string }>().status, 'completed');
    assert.equal((await get(`/sessions/${session.id}`, h.roleCookie(schoolId, 'parent').cookie)).statusCode, 403);
    assert.deepEqual(h.database.sqlite.pragma('foreign_key_check'), []);
  } finally {
    await h.app.close();
    if (resolve(directory).startsWith(resolve(tmpdir(), 'vs-p3-smoke-'))) await rm(directory, { recursive: true, force: true });
  }
});
