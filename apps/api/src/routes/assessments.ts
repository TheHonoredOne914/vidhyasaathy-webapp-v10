import { randomUUID } from 'node:crypto';
import { AssignmentQuerySchema, GradeAttemptSchema, PublishAssignmentSchema, PushAttemptsSchema, ReviewQuerySchema,
  SaveAssignmentSchema, SaveItemSchema, SubmitAttemptSchema, type SaveAssignment } from '@vidhyasaathy/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { assignmentAccess, assignmentDetail, assignmentFilter, assignmentQuestions, assignmentView, attemptChanged,
  bankItem, recordChange, submitAttempt } from '../assessment/service.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import { chapterAccess, requireDraft, resourceId } from '../content/access.ts';
import type { Db } from '../db/index.ts';
import { assignmentItems, assignments, attempts, chapters, concepts, items, notes } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, mutate, scope } from '../school/access.ts';

export function registerAssessmentRoutes(app: FastifyInstance, db: Db, auth: AuthService, now: () => number) {
  const staff = { preHandler: requireRole('admin', 'teacher'), bodyLimit: 256 * 1024 };
  const read = { preHandler: requireRole('admin', 'teacher', 'student') };
  const student = { preHandler: requireRole('student') };
  const change = <T>(request: FastifyRequest, action: string, work: () => T) => mutate(() => db.transaction(() => {
    const result = work();
    auth.audit(request, `assessment.${action}`);
    return result;
  }));
  const itemView = (row: typeof items.$inferSelect) => ({ id: row.id, schoolId: row.schoolId, chapterId: row.chapterId, content: row.content });
  const assignmentFields = ({ sectionId, title, kind, dueAt }: SaveAssignment) => ({ sectionId, title, kind, dueAt });
  function validateItem(schoolId: string, chapterId: string, content: ReturnType<typeof SaveItemSchema.parse>) {
    const concept = found(db.select().from(concepts).where(scope(concepts, schoolId, content.conceptId)).get());
    if (concept.chapterId !== chapterId) throw new ApiException(400, 'CONCEPT_MISMATCH', 'Choose a concept from this chapter.');
    if (content.sourceRef) {
      const note = found(db.select().from(notes).where(scope(notes, schoolId, content.sourceRef.noteId)).get());
      if (note.chapterId !== chapterId) throw new ApiException(400, 'NOTE_MISMATCH', 'Choose a note from this chapter.');
    }
  }
  function saveQuestions(row: typeof assignments.$inferSelect, input: SaveAssignment) {
    for (const id of input.itemIds) {
      const question = found(db.select().from(items).where(and(scope(items, row.schoolId, id), isNull(items.sessionId))).get());
      if (question.chapterId !== row.chapterId) throw new ApiException(400, 'ITEM_MISMATCH', 'Choose questions from this chapter’s bank.');
    }
    db.delete(assignmentItems).where(eq(assignmentItems.assignmentId, row.id)).run();
    input.itemIds.forEach((itemId, position) => db.insert(assignmentItems).values({
      assignmentId: row.id, schoolId: row.schoolId, chapterId: row.chapterId, itemId, position,
    }).run());
  }
  app.get('/chapters/:id/items', staff, async (request) => {
    const chapter = chapterAccess(db, request, resourceId(request), true);
    return db.select().from(items).where(and(eq(items.schoolId, chapter.schoolId), eq(items.chapterId, chapter.id), isNull(items.sessionId))).all().map(itemView);
  });
  app.post('/chapters/:id/items', staff, async (request, reply) => {
    const chapter = chapterAccess(db, request, resourceId(request), true);
    const content = parseInput(SaveItemSchema, request.body);
    validateItem(chapter.schoolId, chapter.id, content);
    return reply.code(201).send(change(request, 'item.create', () => itemView(db.insert(items).values({
      id: randomUUID(), schoolId: chapter.schoolId, chapterId: chapter.id, conceptId: content.conceptId, position: 0, content,
    }).returning().get()!)));
  });
  app.put('/items/:id', staff, async (request) => {
    const row = bankItem(db, request, resourceId(request));
    if (db.select().from(assignmentItems).where(eq(assignmentItems.itemId, row.id)).get()) {
      throw new ApiException(409, 'ITEM_IN_USE', 'Create a new question instead of changing an assigned question.');
    }
    const content = parseInput(SaveItemSchema, request.body);
    validateItem(row.schoolId, row.chapterId, content);
    return change(request, 'item.update', () => itemView(db.update(items).set({ content, conceptId: content.conceptId }).where(eq(items.id, row.id)).returning().get()!));
  });
  app.get('/assignments', read, async (request) => {
    const query = parseInput(AssignmentQuerySchema, request.query);
    return db.select({ row: assignments }).from(assignments).innerJoin(chapters, eq(chapters.id, assignments.chapterId))
      .where(and(assignmentFilter(db, request), query.chapterId ? eq(assignments.chapterId, query.chapterId) : undefined,
        query.sectionId ? eq(assignments.sectionId, query.sectionId) : undefined)).orderBy(assignments.dueAt, assignments.id).all()
      .map(({ row }) => assignmentView(db, request, row));
  });
  app.get('/assignments/:id', read, async (request) => assignmentDetail(db, request, assignmentAccess(db, request, resourceId(request))));
  app.get('/assignments/:id/attempts', read, async (request) => {
    const row = assignmentAccess(db, request, resourceId(request));
    const { profile } = requireAuth(request);
    return db.select().from(attempts).where(and(eq(attempts.assignmentId, row.id),
      profile.role === 'student' ? eq(attempts.profileId, profile.id) : undefined)).orderBy(attempts.serverTs, attempts.id).all();
  });
  app.post('/chapters/:id/assignments', staff, async (request, reply) => {
    const input = parseInput(SaveAssignmentSchema, request.body);
    const chapter = chapterAccess(db, request, resourceId(request), true, input.sectionId);
    return reply.code(201).send(change(request, 'create', () => {
      const row = db.insert(assignments).values({ ...assignmentFields(input), id: randomUUID(), schoolId: chapter.schoolId,
        chapterId: chapter.id, teacherId: requireAuth(request).profile.id, updatedAt: now() }).returning().get()!;
      saveQuestions(row, input);
      return assignmentDetail(db, request, row);
    }));
  });
  app.put('/assignments/:id', staff, async (request) => {
    const row = assignmentAccess(db, request, resourceId(request), true);
    requireDraft(row);
    const input = parseInput(SaveAssignmentSchema, request.body);
    chapterAccess(db, request, row.chapterId, true, input.sectionId);
    return change(request, 'update', () => {
      saveQuestions(row, input);
      const updated = db.update(assignments).set({ ...assignmentFields(input), updatedAt: now() }).where(eq(assignments.id, row.id)).returning().get()!;
      return assignmentDetail(db, request, updated);
    });
  });
  app.post('/assignments/:id/publish', staff, async (request) => {
    const row = assignmentAccess(db, request, resourceId(request), true);
    requireDraft(row);
    parseInput(PublishAssignmentSchema, request.body);
    return change(request, 'publish', () => {
      const timestamp = now();
        const questions = assignmentQuestions(db, row.id);
        for (const item of questions) {
          if (!item.content.sourceRef) continue;
          const note = found(db.select().from(notes).where(scope(notes, row.schoolId, item.content.sourceRef.noteId)).get());
          if (note.status !== 'published' || note.releaseAt === null || note.releaseAt > timestamp) {
            throw new ApiException(400, 'NOTE_NOT_RELEASED', 'Publish referenced notes before publishing this assignment.');
          }
        }
      const updated = db.update(assignments).set({ status: 'published', publishedAt: timestamp, updatedAt: timestamp })
        .where(eq(assignments.id, row.id)).returning().get()!;
      recordChange(db, row.schoolId, 'assignments', row.id, row.id);
        for (const item of questions) recordChange(db, row.schoolId, 'items', item.id, row.id);
      return assignmentDetail(db, request, updated);
    });
  });
  app.post('/attempts', student, async (request) => {
    const input = parseInput(SubmitAttemptSchema, request.body);
    return change(request, 'answer', () => submitAttempt(db, request, input, now()));
  });
  app.post('/sync/attempts', { ...student, bodyLimit: 2 * 1024 * 1024 }, async (request) => {
    const input = parseInput(PushAttemptsSchema, request.body);
    return change(request, 'sync', () => ({ attempts: input.attempts.map((event) => submitAttempt(db, request, event, now())) }));
  });
  app.get('/attempts', staff, async (request) => {
    const query = parseInput(ReviewQuerySchema, request.query);
    return db.select({ row: attempts }).from(attempts).innerJoin(assignments, eq(assignments.id, attempts.assignmentId))
      .innerJoin(chapters, eq(chapters.id, assignments.chapterId)).where(and(assignmentFilter(db, request),
        query.assignmentId ? eq(attempts.assignmentId, query.assignmentId) : undefined,
        query.pendingOnly === 'true' ? eq(attempts.needsReview, true) : undefined)).orderBy(attempts.serverTs, attempts.id).all().map(({ row }) => row);
  });
  app.post('/attempts/:id/grade', staff, async (request) => {
    const input = parseInput(GradeAttemptSchema, request.body);
    const row = found(db.select().from(attempts).where(scope(attempts, requireAuth(request).school.id, resourceId(request))).get());
    if (row.assignmentId === null) throw new ApiException(403, 'FORBIDDEN', 'Optional practice is marked automatically.');
    assignmentAccess(db, request, row.assignmentId, true);
    return change(request, 'grade', () => {
      const timestamp = now();
      const updated = db.update(attempts).set({ correct: input.correct, needsReview: false,
        gradedBy: requireAuth(request).profile.id, gradedAt: timestamp, updatedAt: timestamp }).where(eq(attempts.id, row.id)).returning().get()!;
      attemptChanged(db, updated, timestamp);
      return updated;
    });
  });
}
