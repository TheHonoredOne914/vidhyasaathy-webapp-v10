import { randomUUID } from 'node:crypto';
import { PublishContentSchema, SaveChapterSchema, SaveConceptSchema, SaveNoteSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import { chapterAccess, isAvailable, requireDraft, resourceId, subjectAccess } from '../content/access.ts';
import { noteAccess, noteView } from '../content/notes.ts';
import { chapterStatus } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { chapters, concepts, conceptPrereqs, notes, noteConcepts, profiles, sections, subjects, notifications } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, mutate, scope } from '../school/access.ts';

export function registerContentRoutes(app: FastifyInstance, db: Db, auth: AuthService, now: () => number) {
  const read = { preHandler: requireRole('admin', 'teacher', 'student') };
  const write = { preHandler: requireRole('admin', 'teacher') };
  const change = <T>(request: FastifyRequest, action: string, work: () => T) => mutate(() => db.transaction(() => {
    const result = work();
    auth.audit(request, `content.${action}`);
    return result;
  }));
  const conceptView = (row: typeof concepts.$inferSelect) => {
    const { sourceClass: _sourceClass, ...concept } = row;
    return { ...concept, prerequisiteIds: db.select().from(conceptPrereqs).where(eq(conceptPrereqs.conceptId, row.id)).all().map((edge) => edge.prereqId) };
  };
  function setPrereqs(schoolId: string, chapterId: string, id: string, ids: string[]) {
    const chapter = found(db.select().from(chapters).where(scope(chapters, schoolId, chapterId)).get());
    const edges = db.select().from(conceptPrereqs).where(eq(conceptPrereqs.schoolId, schoolId)).all();
    for (const prereqId of ids) {
      const prereq = found(db.select().from(concepts).where(scope(concepts, schoolId, prereqId)).get());
      const parent = found(db.select().from(chapters).where(scope(chapters, schoolId, prereq.chapterId)).get());
      if (parent.subjectId !== chapter.subjectId) throw new ApiException(400, 'CONCEPT_MISMATCH', 'Prerequisites must belong to the same subject.');
      const pending = [prereqId];
      const visited = new Set<string>();
      while (pending.length) {
        const current = pending.pop()!;
        if (current === id) throw new ApiException(400, 'PREREQUISITE_CYCLE', 'Concept prerequisites cannot form a cycle.');
        if (visited.has(current)) continue;
        visited.add(current);
        pending.push(...edges.filter((edge) => edge.conceptId === current).map((edge) => edge.prereqId));
      }
    }
    db.delete(conceptPrereqs).where(eq(conceptPrereqs.conceptId, id)).run();
    for (const prereqId of ids) db.insert(conceptPrereqs).values({ schoolId, conceptId: id, prereqId }).run();
  }
  function setTags(note: typeof notes.$inferSelect, ids: string[]) {
    for (const id of ids) {
      const concept = found(db.select().from(concepts).where(scope(concepts, note.schoolId, id)).get());
      if (concept.chapterId !== note.chapterId) throw new ApiException(400, 'CONCEPT_MISMATCH', 'Tag concepts from this chapter.');
    }
    db.delete(noteConcepts).where(eq(noteConcepts.noteId, note.id)).run();
    for (const conceptId of ids) db.insert(noteConcepts).values({ noteId: note.id, chapterId: note.chapterId, schoolId: note.schoolId, conceptId }).run();
  }

  app.get('/subjects/:id/chapters', read, async (request) => {
    const subject = subjectAccess(db, request, resourceId(request));
    return db.select().from(chapters).where(and(eq(chapters.schoolId, subject.schoolId), eq(chapters.subjectId, subject.id)))
      .orderBy(chapters.position, chapters.id).all().map((chapter) => ({ ...chapter, status: chapterStatus(db, request, chapter.id, now()) }));
  });
  app.get('/chapters/:id', read, async (request) => {
    const chapter = chapterAccess(db, request, resourceId(request));
    return { ...chapter, status: chapterStatus(db, request, chapter.id, now()) };
  });
  app.post('/chapters', write, async (request, reply) => {
    const input = parseInput(SaveChapterSchema, request.body);
    const subject = subjectAccess(db, request, input.subjectId, true);
    const row = change(request, 'chapter.create', () => db.insert(chapters).values({
      id: randomUUID(), schoolId: subject.schoolId, ...input,
    }).returning().get()!);
    return reply.code(201).send({ ...row, status: 'not_started' });
  });
  app.put('/chapters/:id', write, async (request) => {
    const chapter = chapterAccess(db, request, resourceId(request), true);
    const input = parseInput(SaveChapterSchema, request.body);
    if (input.subjectId !== chapter.subjectId) throw new ApiException(400, 'SUBJECT_MISMATCH', 'A chapter cannot move to another subject.');
    return { ...change(request, 'chapter.update', () => db.update(chapters).set(input).where(eq(chapters.id, chapter.id)).returning().get()!), status: 'not_started' };
  });
  app.get('/chapters/:id/concepts', read, async (request) => {
    const chapter = chapterAccess(db, request, resourceId(request));
    return db.select().from(concepts).where(and(eq(concepts.schoolId, chapter.schoolId), eq(concepts.chapterId, chapter.id))).all().map(conceptView);
  });
  app.post('/chapters/:id/concepts', write, async (request, reply) => {
    const chapter = chapterAccess(db, request, resourceId(request), true);
    const { prerequisiteIds, ...input } = parseInput(SaveConceptSchema, request.body);
    const row = change(request, 'concept.create', () => {
      const concept = db.insert(concepts).values({ id: randomUUID(), schoolId: chapter.schoolId, chapterId: chapter.id, ...input }).returning().get()!;
      setPrereqs(chapter.schoolId, chapter.id, concept.id, prerequisiteIds);
      return conceptView(concept);
    });
    return reply.code(201).send(row);
  });
  app.put('/concepts/:id', write, async (request) => {
    const concept = found(db.select().from(concepts).where(scope(concepts, requireAuth(request).school.id, resourceId(request))).get());
    chapterAccess(db, request, concept.chapterId, true);
    const { prerequisiteIds, ...input } = parseInput(SaveConceptSchema, request.body);
    return change(request, 'concept.update', () => {
      setPrereqs(concept.schoolId, concept.chapterId, concept.id, prerequisiteIds);
      return conceptView(db.update(concepts).set(input).where(eq(concepts.id, concept.id)).returning().get()!);
    });
  });
  app.get('/chapters/:id/notes', read, async (request) => {
    const chapter = chapterAccess(db, request, resourceId(request));
    const student = requireAuth(request).profile.role === 'student';
    return db.select().from(notes).where(and(eq(notes.schoolId, chapter.schoolId), eq(notes.chapterId, chapter.id))).all()
      .filter((note) => !student || isAvailable(note, now())).map((note) => noteView(db, note));
  });
  app.get('/my-class', { preHandler: requireRole('student') }, async (request) => {
    const { school, profile } = requireAuth(request);
    // The session profile has no section; read the enrolment row.
    const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
    if (!enrolled.sectionId) throw new ApiException(404, 'NOT_FOUND', 'Class workspace not found.');
    const section = found(db.select().from(sections).where(scope(sections, school.id, enrolled.sectionId)).get());
    const subjectRows = db.select().from(subjects).where(and(eq(subjects.schoolId, school.id), eq(subjects.classId, section.classId))).all();
    return subjectRows.map((subject) => ({ ...subject, chapters: db.select().from(chapters).where(and(eq(chapters.schoolId, school.id), eq(chapters.subjectId, subject.id))).all().map((chapter) => ({
      ...chapter, status: chapterStatus(db, request, chapter.id, now()), concepts: db.select().from(concepts).where(and(eq(concepts.schoolId, school.id), eq(concepts.chapterId, chapter.id))).all().map((concept) => ({
        ...conceptView(concept), resources: db.select().from(notes).where(and(eq(notes.schoolId, school.id), eq(notes.chapterId, chapter.id))).all()
          .filter((note) => note.status === 'published' && note.releaseAt !== null && note.releaseAt <= now() && noteView(db, note).conceptIds.includes(concept.id))
          .map((note) => noteView(db, note)),
      })),
    })) }));
  });
  app.get('/notes/:id', read, async (request) => noteView(db, noteAccess(db, request, resourceId(request), now())));
  app.post('/chapters/:id/notes', { ...write, bodyLimit: 32768 }, async (request, reply) => {
    const chapter = chapterAccess(db, request, resourceId(request), true);
    const { conceptIds, ...input } = parseInput(SaveNoteSchema, request.body);
    const note = change(request, 'note.create', () => {
      const row = db.insert(notes).values({ id: randomUUID(), schoolId: chapter.schoolId, chapterId: chapter.id, updatedAt: now(), ...input }).returning().get()!;
      setTags(row, conceptIds);
      return noteView(db, row);
    });
    return reply.code(201).send(note);
  });
  app.put('/notes/:id', { ...write, bodyLimit: 32768 }, async (request) => {
    const note = noteAccess(db, request, resourceId(request), now(), true);
    requireDraft(note);
    const { conceptIds, ...input } = parseInput(SaveNoteSchema, request.body);
    return change(request, 'note.update', () => {
      setTags(note, conceptIds);
      return noteView(db, db.update(notes).set({ ...input, updatedAt: now() }).where(eq(notes.id, note.id)).returning().get()!);
    });
  });
  app.post('/notes/:id/publish', write, async (request) => {
    const note = noteAccess(db, request, resourceId(request), now(), true);
    requireDraft(note);
    const input = parseInput(PublishContentSchema, request.body);
    if (!noteView(db, note).conceptIds.length) throw new ApiException(400, 'CONCEPT_REQUIRED', 'Tag at least one concept before publishing.');
    return change(request, 'note.publish', () => {
      const saved = db.update(notes).set({
      status: 'published', releaseAt: input.releaseAt ?? now(), updatedAt: now(),
      }).where(eq(notes.id, note.id)).returning().get()!;
      const chapter = found(db.select().from(chapters).where(scope(chapters, note.schoolId, note.chapterId)).get());
      const subject = found(db.select().from(subjects).where(scope(subjects, chapter.schoolId, chapter.subjectId)).get());
      const eligibleSections = db.select().from(sections).where(and(eq(sections.schoolId, subject.schoolId), eq(sections.classId, subject.classId))).all();
      const eligibleIds = new Set(eligibleSections.map((section) => section.id));
      for (const student of db.select().from(profiles).where(and(eq(profiles.schoolId, note.schoolId), eq(profiles.role, 'student'))).all()) {
        if (!student.sectionId || !eligibleIds.has(student.sectionId)) continue;
        const notificationId = randomUUID();
        db.insert(notifications).values({ id: notificationId, schoolId: note.schoolId, profileId: student.id, announcementId: null,
          dedupeKey: `content:${note.id}:${student.id}`, kind: 'content_publish', title: saved.title, body: 'New class material is available.',
          href: `/student/notes/${note.id}`, channel: 'in_app', status: 'delivered', failure: null, createdAt: now(), deliverAfter: now(), deliveredAt: now(), readAt: null }).onConflictDoNothing().run();
      }
      return noteView(db, saved);
    });
  });
}
