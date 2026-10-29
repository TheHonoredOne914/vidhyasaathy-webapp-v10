import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  ChapterSchema, ConceptSchema, LearningSessionSchema, MAX_UPLOAD_BYTES, NoteSchema, PublicItemSchema,
  type Me, type SaveLearningSession,
} from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  academicYears, chapters, classes, concepts, conceptPrereqs, notes, profiles, sections,
  sessionProgress, slides, subjects, teacherAssignments,
} from '../src/db/schema.ts';
import { cookieFrom, createHarness, ORIGIN, type Harness } from './helpers.ts';

describe('content and learning sessions', () => {
  let h: Harness;
  let directory: string;
  let schoolId: string;
  let admin: string;
  let teacher: string;
  let unassigned: string;
  let student: string;
  let studentId: string;
  let otherStudent: string;
  let parent: string;
  let sectionId: string;
  let otherSectionId: string;
  let subjectId: string;
  let otherSubjectId: string;
  let chapterId: string;
  let conceptId: string;
  let noteId: string;

  const get = (url: string, cookie: string) => h.app.inject({ url, headers: { cookie } });
  const put = (url: string, payload: unknown, cookie = teacher) => h.app.inject({
    method: 'PUT', url, payload: payload as Record<string, unknown>, headers: { cookie, origin: ORIGIN },
  });
  async function createNote() {
    const response = await h.post(`/chapters/${chapterId}/notes`, {
      title: 'Fractions note', body: 'One half is one of two equal parts.', conceptIds: [conceptId],
    }, teacher);
    expect(response.statusCode).toBe(201);
    return NoteSchema.parse(response.json());
  }
  function sessionInput(section = sectionId): SaveLearningSession {
    const base = { conceptId, prompt: 'Recall one half', difficulty: 1, sourceRef: null };
    return {
      sectionId: section, title: 'Study fractions',
      slides: ['First slide', 'Second slide', 'Final hidden slide'].map((body) => ({
        conceptId, title: body, body, noteId: null,
      })),
      check: [
        { ...base, type: 'mcq', options: ['one half', 'one third'], answer: 'one half' },
        { ...base, type: 'match_pairs', pairs: [{ left: '1/2', right: 'half' }, { left: '1/3', right: 'third' }] },
        { ...base, type: 'short_answer', acceptedAnswers: ['one half'] },
        { ...base, type: 'flashcard', answer: 'one half' },
      ],
    };
  }
  async function createSession(input = sessionInput(), cookie = teacher) {
    const response = await h.post(`/chapters/${chapterId}/sessions`, input, cookie);
    expect(response.statusCode).toBe(201);
    return LearningSessionSchema.parse(response.json());
  }
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'vs-content-'));
    h = await createHarness({ uploadsDirectory: directory });
    const registration = await h.register();
    admin = cookieFrom(registration.headers);
    schoolId = registration.json<Me>().school.id;
    const db = h.database.db;
    const yearId = randomUUID();
    const classId = randomUUID();
    sectionId = randomUUID();
    otherSectionId = randomUUID();
    subjectId = randomUUID();
    otherSubjectId = randomUUID();
    db.insert(academicYears).values({ id: yearId, schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }).run();
    db.insert(classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(sections).values([
      { id: sectionId, schoolId, classId, name: 'A' }, { id: otherSectionId, schoolId, classId, name: 'B' },
    ]).run();
    db.insert(subjects).values([
      { id: subjectId, schoolId, classId, name: 'Maths' }, { id: otherSubjectId, schoolId, classId, name: 'Science' },
    ]).run();
    const assigned = h.roleCookie(schoolId, 'teacher');
    teacher = assigned.cookie;
    db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: assigned.profileId, sectionId, subjectId, classId }).run();
    unassigned = h.roleCookie(schoolId, 'teacher').cookie;
    const pupil = h.roleCookie(schoolId, 'student');
    student = pupil.cookie;
    studentId = pupil.profileId;
    db.update(profiles).set({ sectionId, rollNumber: '1' }).where(eq(profiles.id, studentId)).run();
    const otherPupil = h.roleCookie(schoolId, 'student');
    otherStudent = otherPupil.cookie;
    db.update(profiles).set({ sectionId: otherSectionId, rollNumber: '1' }).where(eq(profiles.id, otherPupil.profileId)).run();
    parent = h.roleCookie(schoolId, 'parent').cookie;
    const chapter = await h.post('/chapters', { subjectId, title: 'Fractions', position: 0 }, teacher);
    expect(chapter.statusCode).toBe(201);
    chapterId = ChapterSchema.parse(chapter.json()).id;
    const concept = await h.post(`/chapters/${chapterId}/concepts`, { title: 'Halves', description: 'Equal parts', prerequisiteIds: [] }, teacher);
    expect(concept.statusCode).toBe(201);
    conceptId = ConceptSchema.parse(concept.json()).id;
    noteId = (await createNote()).id;
  });
  afterEach(async () => {
    if (h) await h.app.close();
    // Resolve and verify the exact test-owned directory before recursive removal.
    if (directory && resolve(directory).startsWith(resolve(tmpdir(), 'vs-content-'))) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('authors scoped chapters, concepts, tagged notes and editable session drafts', async () => {
    expect((await put(`/chapters/${chapterId}`, { subjectId, title: 'Equal fractions', position: 2 })).statusCode).toBe(200);
    expect((await get(`/subjects/${subjectId}/chapters`, student)).json()).toEqual([
      expect.objectContaining({ id: chapterId, position: 2, status: 'not_started' }),
    ]);
    expect((await get(`/chapters/${chapterId}/concepts`, teacher)).json()).toHaveLength(1);
    expect((await put(`/notes/${noteId}`, { title: 'Updated note', body: 'A half is an equal part.', conceptIds: [conceptId] })).statusCode).toBe(200);
    const draft = await createSession();
    expect((await put(`/sessions/${draft.id}`, { ...sessionInput(), title: 'Updated study' })).statusCode).toBe(200);
    expect((await get(`/notes/${noteId}`, admin)).json()).toMatchObject({ title: 'Updated note', file: null });
  });

  it('enforces author roles, teacher subject assignments and parent denial on every surface', async () => {
    const session = await createSession();
    const readPaths = [
      `/subjects/${subjectId}/chapters`, `/chapters/${chapterId}`, `/chapters/${chapterId}/concepts`,
      `/chapters/${chapterId}/notes`, `/notes/${noteId}`, `/notes/${noteId}/file`,
      `/chapters/${chapterId}/sessions`, `/sessions/${session.id}`,
    ];
    for (const path of readPaths) {
      expect((await h.app.inject({ url: path })).statusCode).toBe(401);
      expect((await get(path, parent)).statusCode).toBe(403);
      expect((await get(path, unassigned)).statusCode).toBe(403);
    }
    const posts = [
      ['/chapters', { subjectId, title: 'New', position: 1 }],
      [`/chapters/${chapterId}/concepts`, { title: 'New', description: '', prerequisiteIds: [] }],
      [`/chapters/${chapterId}/notes`, { title: 'New', body: 'Body', conceptIds: [conceptId] }],
      [`/chapters/${chapterId}/sessions`, sessionInput()],
      [`/notes/${noteId}/publish`, {}], [`/notes/${noteId}/file`, {}], [`/sessions/${session.id}/publish`, {}],
    ] as const;
    for (const [path, body] of posts) for (const cookie of [student, parent, unassigned]) {
      expect((await h.post(path, body, cookie)).statusCode).toBe(403);
    }
    for (const path of [`/chapters/${chapterId}`, `/concepts/${conceptId}`, `/notes/${noteId}`, `/sessions/${session.id}`]) {
      for (const cookie of [student, parent, unassigned]) expect((await put(path, {}, cookie)).statusCode).toBe(403);
    }
    expect((await h.post('/chapters', { subjectId: otherSubjectId, title: 'Wrong subject', position: 0 }, teacher)).statusCode).toBe(403);
    for (const cookie of [admin, teacher, parent]) {
      expect((await h.post(`/sessions/${session.id}/advance`, { slideId: session.slides[0]!.id }, cookie)).statusCode).toBe(403);
      expect((await h.post(`/sessions/${session.id}/check`, { answers: [] }, cookie)).statusCode).toBe(403);
    }
    expect((await h.app.inject({ method: 'POST', url: '/chapters', payload: {}, headers: { cookie: admin } })).statusCode).toBe(403);
  });

  it('isolates schools, enrolled classes, sections and teacher section assignments', async () => {
    const session = await createSession();
    expect((await get(`/sessions/${session.id}`, otherStudent)).statusCode).toBe(403);
    const otherSession = await createSession(sessionInput(otherSectionId), admin);
    expect((await get(`/sessions/${otherSession.id}`, teacher)).statusCode).toBe(403);
    expect((await h.post(`/chapters/${chapterId}/sessions`, sessionInput(otherSectionId), teacher)).statusCode).toBe(403);
    expect((await get(`/chapters/${chapterId}/sessions`, teacher)).json()).toHaveLength(1);
    const otherClassId = randomUUID();
    h.database.db.insert(classes).values({ id: otherClassId, schoolId, academicYearId: h.database.db.select().from(academicYears).get()!.id, name: '7' }).run();
    const otherClassSubject = randomUUID();
    h.database.db.insert(subjects).values({ id: otherClassSubject, schoolId, classId: otherClassId, name: 'Maths' }).run();
    expect((await get(`/subjects/${otherClassSubject}/chapters`, student)).statusCode).toBe(403);
    expect((await h.post(`/chapters/${chapterId}/sessions`, { ...sessionInput(), sectionId: randomUUID() }, admin)).statusCode).toBe(404);
    const otherRegistration = await h.register('other@example.test');
    const otherAdmin = cookieFrom(otherRegistration.headers);
    for (const path of [`/subjects/${subjectId}/chapters`, `/chapters/${chapterId}`, `/notes/${noteId}`, `/sessions/${session.id}`, `/notes/${noteId}/file`]) {
      expect((await get(path, otherAdmin)).statusCode).toBe(404);
    }
    expect((await h.post(`/chapters/${chapterId}/notes`, { title: 'Cross-school', body: 'Body', conceptIds: [conceptId] }, otherAdmin)).statusCode).toBe(404);
    expect(() => h.database.db.insert(chapters).values({ id: randomUUID(), schoolId: otherRegistration.json<Me>().school.id, subjectId, title: 'Bad', position: 0 }).run()).toThrow();
  });

  it('rejects prerequisite cycles and cross-chapter tags atomically', async () => {
    const dependent = await h.post(`/chapters/${chapterId}/concepts`, { title: 'Quarters', description: '', prerequisiteIds: [conceptId] }, teacher);
    const dependentId = ConceptSchema.parse(dependent.json()).id;
    const cycle = await put(`/concepts/${conceptId}`, { title: 'Changed', description: '', prerequisiteIds: [dependentId] });
    expect(cycle.statusCode).toBe(400);
    expect(cycle.json()).toMatchObject({ code: 'PREREQUISITE_CYCLE' });
    expect(h.database.db.select().from(conceptPrereqs).all()).toHaveLength(1);
    expect(h.database.db.select().from(concepts).where(eq(concepts.id, conceptId)).get()!.title).toBe('Halves');
    const next = await h.post('/chapters', { subjectId, title: 'Decimals', position: 1 }, teacher);
    const nextId = ChapterSchema.parse(next.json()).id;
    expect((await h.post(`/chapters/${nextId}/notes`, { title: 'Invalid tag', body: 'Body', conceptIds: [conceptId] }, teacher)).statusCode).toBe(400);
    expect(h.database.db.select().from(notes).all()).toHaveLength(1);
    expect((await h.post(`/chapters/${nextId}/sessions`, sessionInput(), teacher)).statusCode).toBe(400);
  });

  it('keeps drafts and timed notes private, releases at the boundary and freezes published content', async () => {
    expect((await get(`/notes/${noteId}`, student)).statusCode).toBe(403);
    expect((await get(`/chapters/${chapterId}/notes`, student)).json()).toEqual([]);
    const releaseAt = h.now() + 1000;
    expect((await h.post(`/notes/${noteId}/publish`, { releaseAt }, teacher)).statusCode).toBe(200);
    expect((await get(`/notes/${noteId}`, student)).statusCode).toBe(403);
    h.advance(999);
    expect((await get(`/chapters/${chapterId}/notes`, student)).json()).toEqual([]);
    h.advance(1);
    expect((await get(`/notes/${noteId}`, student)).json()).toMatchObject({ id: noteId, status: 'published', releaseAt });
    expect((await get(`/chapters/${chapterId}/notes`, student)).json()).toHaveLength(1);
    expect((await put(`/notes/${noteId}`, { title: 'Changed', body: 'Body', conceptIds: [conceptId] })).statusCode).toBe(409);
    expect((await h.post(`/notes/${noteId}/file`, {}, teacher)).statusCode).toBe(409);
    expect((await h.post(`/notes/${noteId}/publish`, {}, teacher)).statusCode).toBe(409);
    const untagged = await h.post(`/chapters/${chapterId}/notes`, { title: 'Untagged', body: 'Body', conceptIds: [] }, teacher);
    expect((await h.post(`/notes/${untagged.json<{ id: string }>().id}/publish`, {}, teacher)).statusCode).toBe(400);
  });

  it('authenticates file storage and downloads without exposing paths or unreleased files', async () => {
    const upload = { filename: 'fractions.txt', contentType: 'text/plain', dataBase64: Buffer.from('One half').toString('base64') };
    expect((await h.post(`/notes/${noteId}/file`, upload)).statusCode).toBe(401);
    const response = await h.post(`/notes/${noteId}/file`, upload, teacher);
    expect(response.statusCode).toBe(200);
    expect(NoteSchema.parse(response.json()).file).toEqual({ filename: upload.filename, contentType: upload.contentType, size: 8 });
    expect(response.body).not.toContain(directory);
    expect(response.body).not.toContain('fileKey');
    expect((await readdir(directory))).toHaveLength(1);
    expect((await h.post(`/notes/${noteId}/file`, upload, teacher)).statusCode).toBe(409);
    expect((await get(`/notes/${noteId}/file`, student)).statusCode).toBe(403);
    await h.post(`/notes/${noteId}/publish`, { releaseAt: h.now() + 1000 }, teacher);
    expect((await get(`/notes/${noteId}/file`, student)).statusCode).toBe(403);
    h.advance(1000);
    const download = await get(`/notes/${noteId}/file`, student);
    expect(download.statusCode).toBe(200);
    expect(download.body).toBe('One half');
    expect(download.headers).toMatchObject({ 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    expect(download.headers['content-disposition']).toContain('attachment;');
    expect((await get(`/notes/${noteId}/file`, parent)).statusCode).toBe(403);
  });

  it('validates upload types, signatures, filenames, encoding and decoded size', async () => {
    const valid = { filename: 'note.txt', contentType: 'text/plain', dataBase64: 'bm90ZQ==' };
    for (const change of [
      { filename: '../note.txt' }, { contentType: 'text/html' }, { dataBase64: 'bad!' },
      { filename: 'note.pdf', contentType: 'application/pdf' }, { dataBase64: 'AA==' }, { dataBase64: '/w==' },
      { dataBase64: 'Zh==' },
    ]) expect((await h.post(`/notes/${noteId}/file`, { ...valid, ...change }, teacher)).statusCode).toBe(400);
    expect((await h.post(`/notes/${noteId}/file`, { ...valid, dataBase64: Buffer.alloc(MAX_UPLOAD_BYTES + 1, 65).toString('base64') }, teacher)).statusCode).toBe(413);
    expect(await readdir(directory)).toEqual([]);
    for (const [filename, contentType, data] of [
      ['note.pdf', 'application/pdf', Buffer.from('%PDF-1.7\n')],
      ['note.png', 'image/png', Buffer.from('89504e470d0a1a0a', 'hex')],
      ['note.jpg', 'image/jpeg', Buffer.from('ffd8ffe0', 'hex')],
    ] as const) {
      const note = await createNote();
      expect((await h.post(`/notes/${note.id}/file`, { filename, contentType, dataBase64: data.toString('base64') }, teacher)).statusCode).toBe(200);
    }
  });

  it('requires referenced notes to be published no later than the session release', async () => {
    const input = sessionInput();
    input.slides[0]!.noteId = noteId;
    input.check[0]!.sourceRef = { noteId, locator: 'Paragraph 1' };
    const session = await createSession(input);
    expect((await h.post(`/sessions/${session.id}/publish`, {}, teacher)).statusCode).toBe(400);
    await h.post(`/notes/${noteId}/publish`, { releaseAt: h.now() + 2000 }, teacher);
    expect((await h.post(`/sessions/${session.id}/publish`, { releaseAt: h.now() + 1000 }, teacher)).statusCode).toBe(400);
    expect((await h.post(`/sessions/${session.id}/publish`, { releaseAt: h.now() + 2000 }, teacher)).statusCode).toBe(200);
    expect((await put(`/sessions/${session.id}`, sessionInput())).statusCode).toBe(409);
  });

  it('blocks every student entry point before timed session release', async () => {
    const session = await createSession();
    const publishAt = h.now() + 1000;
    await h.post(`/sessions/${session.id}/publish`, { releaseAt: publishAt }, teacher);
    expect((await get(`/chapters/${chapterId}/sessions`, student)).json()).toEqual([]);
    expect((await get(`/sessions/${session.id}`, student)).statusCode).toBe(403);
    expect((await h.post(`/sessions/${session.id}/advance`, { slideId: session.slides[0]!.id }, student)).statusCode).toBe(403);
    expect((await h.post(`/sessions/${session.id}/check`, { answers: [{ itemId: session.check[0]!.id, answer: 'one half' }] }, student)).statusCode).toBe(403);
    h.advance(1000);
    expect((await get(`/sessions/${session.id}`, student)).statusCode).toBe(200);
    expect((await get(`/chapters/${chapterId}/sessions`, student)).json()).toHaveLength(1);
    expect((await get(`/chapters/${chapterId}/sessions`, otherStudent)).json()).toEqual([]);
  });

  it('hides a published session that has no slides instead of failing the chapter', async () => {
    const session = await createSession();
    await h.post(`/sessions/${session.id}/publish`, {}, teacher);
    // Seeds and imports can bypass the save schema; an empty published session must not break the chapter.
    h.database.db.delete(slides).where(eq(slides.sessionId, session.id)).run();
    const listed = await get(`/chapters/${chapterId}/sessions`, student);
    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toEqual([]);
    expect((await get(`/chapters/${chapterId}`, student)).statusCode).toBe(200);
    expect((await get(`/sessions/${session.id}`, student)).statusCode).toBe(404);
    expect((await get(`/sessions/${session.id}`, teacher)).json()).toMatchObject({ slides: [], progress: null });
    expect((await get(`/chapters/${chapterId}/sessions`, teacher)).json()).toHaveLength(1);
  });

  it('unlocks slides sequentially and completes only after a full check, idempotently per student', async () => {
    const session = await createSession();
    await h.post(`/sessions/${session.id}/publish`, {}, teacher);
    const initial = await get(`/sessions/${session.id}`, student);
    expect(LearningSessionSchema.parse(initial.json()).slides).toHaveLength(1);
    expect(initial.json()).toMatchObject({ check: [], progress: { viewedSlides: 0, completed: false, checkAvailable: false } });
    expect(initial.body).not.toContain('Final hidden slide');
    expect(initial.body).not.toContain('acceptedAnswers');
    const answers = session.check.map((item, index) => ({ itemId: item.id, answer: index === 1 ? ['half', 'third'] : 'one half' }));
    expect((await h.post(`/sessions/${session.id}/check`, { answers }, student)).statusCode).toBe(403);
    expect((await h.post(`/sessions/${session.id}/advance`, { slideId: session.slides[2]!.id }, student)).statusCode).toBe(403);
    expect((await h.post(`/sessions/${session.id}/advance`, { slideId: randomUUID() }, student)).statusCode).toBe(404);
    for (const [index, slide] of session.slides.entries()) {
      const response = await h.post(`/sessions/${session.id}/advance`, { slideId: slide.id }, student);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ progress: { viewedSlides: index + 1, completed: false } });
    }
    const unlocked = (await get(`/sessions/${session.id}`, student)).json<{ check: unknown[] }>();
    expect(unlocked.check).toHaveLength(4);
    for (const item of unlocked.check) expect(PublicItemSchema.safeParse(item).success).toBe(true);
    expect((await h.post(`/sessions/${session.id}/advance`, { slideId: session.slides[0]!.id }, student)).json()).toMatchObject({ progress: { viewedSlides: 3, completed: false } });
    expect((await get(`/chapters/${chapterId}`, student)).json()).toMatchObject({ status: 'in_progress' });
    expect((await h.post(`/sessions/${session.id}/check`, { answers: answers.slice(1) }, student)).statusCode).toBe(400);
    expect((await h.post(`/sessions/${session.id}/check`, { answers: [answers[0], answers[0], ...answers.slice(2)] }, student)).statusCode).toBe(400);
    expect((await h.post(`/sessions/${session.id}/check`, { answers: answers.map((answer, i) => i === 1 ? { ...answer, answer: 'half' } : answer) }, student)).statusCode).toBe(400);
    expect(h.database.db.select().from(sessionProgress).get()!.completedAt).toBeNull();
    // P3 records a completed check, not a score; marking belongs to P4.
    expect((await h.post(`/sessions/${session.id}/check`, { answers }, student)).json()).toMatchObject({ progress: { completed: true } });
    const completedAt = h.database.db.select().from(sessionProgress).get()!.completedAt;
    h.advance(10);
    expect((await h.post(`/sessions/${session.id}/check`, { answers }, student)).statusCode).toBe(200);
    expect(h.database.db.select().from(sessionProgress).all()).toHaveLength(1);
    expect(h.database.db.select().from(sessionProgress).get()!.completedAt).toBe(completedAt);
    expect((await get(`/chapters/${chapterId}`, student)).json()).toMatchObject({ status: 'completed' });
    const freshStudent = h.roleCookie(schoolId, 'student');
    h.database.db.update(profiles).set({ sectionId, rollNumber: '2' }).where(eq(profiles.id, freshStudent.profileId)).run();
    expect((await get(`/sessions/${session.id}`, freshStudent.cookie)).json()).toMatchObject({ progress: { viewedSlides: 0, completed: false } });
    expect(() => h.database.db.insert(slides).values({ id: randomUUID(), schoolId, chapterId, sessionId: session.id, conceptId, noteId: null, position: 0, title: 'Duplicate', body: 'Body' }).run()).toThrow();
    expect(() => h.database.db.update(sessionProgress).set({ completedAt: h.now(), checkSubmittedAt: null }).where(eq(sessionProgress.profileId, studentId)).run()).toThrow();
    expect(h.database.sqlite.pragma('foreign_key_check')).toEqual([]);
  });
});
