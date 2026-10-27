import { randomUUID } from 'node:crypto';
import { AdvanceSessionSchema, PublishContentSchema, SaveLearningSessionSchema, SubmitSessionCheckSchema, type SaveLearningSession } from '@vidhyasaathy/contracts';
import { advanceSlide, completeSession } from '@vidhyasaathy/core/session';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { requireRemediationComplete } from '../ai/remediation-progress.ts';
import { markItem, refreshConcept } from '../assessment/service.ts';
import type { AuthService } from '../auth/service.ts';
import { chapterAccess, requireDraft, resourceId } from '../content/access.ts';
import { learningSessionAccess, progressRow, sessionItems, sessionSlides, sessionView, visibleSessions } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { concepts, items, learningEvidence, learningSessions, notes, sessionProgress, slides } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, mutate, scope } from '../school/access.ts';

export function registerLearningSessionRoutes(app: FastifyInstance, db: Db, auth: AuthService, now: () => number) {
  const write = { preHandler: requireRole('admin', 'teacher'), bodyLimit: 3 * 1024 * 1024 };
  const student = { preHandler: requireRole('student') };
  const change = <T>(request: FastifyRequest, action: string, work: () => T) => mutate(() => db.transaction(() => {
    const result = work();
    auth.audit(request, `content.session.${action}`);
    return result;
  }));
  function saveChildren(session: typeof learningSessions.$inferSelect, input: SaveLearningSession) {
    const shared = { schoolId: session.schoolId, chapterId: session.chapterId, sessionId: session.id };
    for (const part of [...input.slides, ...input.check]) {
      const concept = found(db.select().from(concepts).where(scope(concepts, session.schoolId, part.conceptId)).get());
      if (concept.chapterId !== session.chapterId) throw new ApiException(400, 'CONCEPT_MISMATCH', 'Choose concepts from this chapter.');
    }
    const noteIds = [...input.slides.map((slide) => slide.noteId), ...input.check.map((item) => item.sourceRef?.noteId)];
    for (const id of noteIds) {
      if (!id) continue;
      const note = found(db.select().from(notes).where(scope(notes, session.schoolId, id)).get());
      if (note.chapterId !== session.chapterId) throw new ApiException(400, 'NOTE_MISMATCH', 'Choose notes from this chapter.');
    }
    db.delete(slides).where(eq(slides.sessionId, session.id)).run();
    db.delete(items).where(eq(items.sessionId, session.id)).run();
    input.slides.forEach((slide, position) => db.insert(slides).values({ ...shared, ...slide, id: randomUUID(), position }).run());
    input.check.forEach((content, position) => db.insert(items).values({ ...shared, id: randomUUID(), conceptId: content.conceptId, position, content }).run());
  }
  app.get('/chapters/:id/sessions', { preHandler: requireRole('admin', 'teacher', 'student') }, async (request) => {
    return visibleSessions(db, request, resourceId(request), now()).map((session) => {
      const { id, schoolId, chapterId, sectionId, title, status, releaseAt, updatedAt, progress } = sessionView(db, request, session);
      return { id, schoolId, chapterId, sectionId, title, status, releaseAt, updatedAt, progress };
    });
  });
  app.get('/sessions/:id', { preHandler: requireRole('admin', 'teacher', 'student') }, async (request) => {
    return sessionView(db, request, learningSessionAccess(db, request, resourceId(request), now()));
  });
  app.post('/chapters/:id/sessions', write, async (request, reply) => {
    const input = parseInput(SaveLearningSessionSchema, request.body);
    const chapter = chapterAccess(db, request, resourceId(request), true, input.sectionId);
    const session = change(request, 'create', () => {
      const row = db.insert(learningSessions).values({
        id: randomUUID(), schoolId: chapter.schoolId, chapterId: chapter.id, sectionId: input.sectionId, title: input.title, updatedAt: now(),
      }).returning().get()!;
      saveChildren(row, input);
      return sessionView(db, request, row);
    });
    return reply.code(201).send(session);
  });
  app.put('/sessions/:id', write, async (request) => {
    const session = learningSessionAccess(db, request, resourceId(request), now(), true);
    requireDraft(session);
    const input = parseInput(SaveLearningSessionSchema, request.body);
    chapterAccess(db, request, session.chapterId, true, input.sectionId);
    return change(request, 'update', () => {
      saveChildren(session, input);
      const row = db.update(learningSessions).set({ title: input.title, sectionId: input.sectionId, updatedAt: now() })
        .where(eq(learningSessions.id, session.id)).returning().get()!;
      return sessionView(db, request, row);
    });
  });
  app.post('/sessions/:id/publish', write, async (request) => {
    const session = learningSessionAccess(db, request, resourceId(request), now(), true);
    requireDraft(session);
    const releaseAt = parseInput(PublishContentSchema, request.body).releaseAt ?? now();
    const referenced = [
      ...sessionSlides(db, session.id).map((slide) => slide.noteId),
      ...sessionItems(db, session.id).map((item) => item.content.sourceRef?.noteId),
    ];
    for (const id of referenced) {
      if (!id) continue;
      const note = found(db.select().from(notes).where(scope(notes, session.schoolId, id)).get());
      if (note.status !== 'published' || note.releaseAt === null || note.releaseAt > releaseAt) {
        throw new ApiException(400, 'NOTE_NOT_RELEASED', 'Publish referenced notes no later than the session’s release.');
      }
    }
    return change(request, 'publish', () => sessionView(db, request, db.update(learningSessions).set({
      status: 'published', releaseAt, updatedAt: now(),
    }).where(eq(learningSessions.id, session.id)).returning().get()!));
  });
  app.post('/sessions/:id/advance', student, async (request) => {
    const input = parseInput(AdvanceSessionSchema, request.body);
    const session = learningSessionAccess(db, request, resourceId(request), now());
    return change(request, 'advance', () => {
      const all = sessionSlides(db, session.id);
      const slide = found(all.find((row) => row.id === input.slideId));
      const profileId = requireAuth(request).profile.id;
      const previous = progressRow(db, session.id, profileId);
      if (slide.position > (previous?.viewedSlides ?? 0)) throw new ApiException(403, 'SLIDE_LOCKED', 'Finish the previous slide first.');
      if (slide.position >= (previous?.viewedSlides ?? 0)) requireRemediationComplete(db, session.schoolId, profileId, slide.conceptId);
      const viewedSlides = advanceSlide(all.length, previous?.viewedSlides ?? 0, slide.position);
      db.insert(sessionProgress).values({ sessionId: session.id, profileId, schoolId: session.schoolId, viewedSlides })
        .onConflictDoUpdate({ target: [sessionProgress.sessionId, sessionProgress.profileId], set: { viewedSlides } }).run();
      return sessionView(db, request, session);
    });
  });
  app.post('/sessions/:id/check', student, async (request) => {
    const input = parseInput(SubmitSessionCheckSchema, request.body);
    const session = learningSessionAccess(db, request, resourceId(request), now());
    return change(request, 'check', () => {
      const profileId = requireAuth(request).profile.id;
      const previous = progressRow(db, session.id, profileId);
      const allSlides = sessionSlides(db, session.id);
      if (previous?.viewedSlides !== allSlides.length) throw new ApiException(403, 'CHECK_LOCKED', 'Finish every slide before the check.');
      const check = sessionItems(db, session.id);
      const ids = new Set(input.answers.map((answer) => answer.itemId));
      if (ids.size !== input.answers.length || ids.size !== check.length || !check.every((item) => ids.has(item.id))) {
        throw new ApiException(400, 'INCOMPLETE_CHECK', 'Answer each check item exactly once.');
      }
        if (previous.completedAt === null) {
          for (const conceptId of new Set(check.map((item) => item.content.conceptId))) {
            requireRemediationComplete(db, session.schoolId, profileId, conceptId);
        }
        }
      for (const item of check) {
        const answer = input.answers.find((entry) => entry.itemId === item.id)!.answer;
          const correct = markItem(item.content, answer);
          if (previous.completedAt === null && correct !== null) {
            db.insert(learningEvidence).values({ id: `session:${session.id}:${profileId}:${item.id}`,
              schoolId: session.schoolId, profileId, conceptId: item.content.conceptId, correct, source: 'session', createdAt: now() })
              .onConflictDoNothing().run();
            refreshConcept(db, { schoolId: session.schoolId, profileId, conceptId: item.content.conceptId }, now());
          }
      }
      completeSession(allSlides.length, previous.viewedSlides, true);
      if (previous.completedAt === null) db.update(sessionProgress).set({ checkSubmittedAt: now(), completedAt: now() }).where(and(
        eq(sessionProgress.sessionId, session.id), eq(sessionProgress.profileId, profileId),
      )).run();
      return sessionView(db, request, session);
    });
  });
}
