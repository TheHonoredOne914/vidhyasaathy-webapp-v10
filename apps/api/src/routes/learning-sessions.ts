import { randomUUID } from 'node:crypto';
import { AdvanceSessionSchema, PublishContentSchema, SaveLearningSessionSchema, StudentStudySessionsSchema, SubmitSessionCheckSchema, type SaveLearningSession, type StudentStudySession } from '@vidhyasaathy/contracts';
import { clampLevel, sessionGate, type Confidence, type ErrorFamily } from '@vidhyasaathy/core/learning';
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
import { chapters, concepts, items, learningEvidence, learningSessions, notes, profiles, sessionProgress, slides, subjects } from '../db/schema.ts';
import { touchStreak } from '../daily/streak-store.ts';
import { mistakeFor, recordAnswer } from '../learning/record.ts';
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
  app.get('/student/study-sessions', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const me = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
    const at = now();
    const rows = db.select({ session: learningSessions, chapter: chapters, subject: subjects }).from(learningSessions)
      .innerJoin(chapters, and(eq(chapters.id, learningSessions.chapterId), eq(chapters.schoolId, learningSessions.schoolId)))
      .innerJoin(subjects, and(eq(subjects.id, chapters.subjectId), eq(subjects.schoolId, chapters.schoolId)))
      .where(and(eq(learningSessions.schoolId, school.id), eq(learningSessions.sectionId, me.sectionId ?? ''), eq(learningSessions.status, 'published'))).all();
    const sessions: StudentStudySession[] = [];
    for (const { session, chapter, subject } of rows) {
      const total = sessionSlides(db, session.id).length;
      if (!total) continue;
      const progress = progressRow(db, session.id, profile.id);
      const viewedSlides = Math.min(progress?.viewedSlides ?? 0, total);
      const completedAt = progress?.completedAt ?? null;
      const state: StudentStudySession['state'] = session.releaseAt !== null && session.releaseAt > at ? 'upcoming'
        : completedAt !== null ? 'done' : viewedSlides > 0 ? 'in_progress' : 'new';
      sessions.push({ id: session.id, chapterId: chapter.id, chapterTitle: chapter.title, subject: subject.name, title: session.title,
        state, releaseAt: session.releaseAt, slides: total, viewedSlides, completedAt });
    }
    const order = { in_progress: 0, new: 1, upcoming: 2, done: 3 } as const;
    sessions.sort((a, b) => order[a.state] - order[b.state]
      || (a.state === 'upcoming' ? (a.releaseAt ?? 0) - (b.releaseAt ?? 0) : a.state === 'done' ? (b.completedAt ?? 0) - (a.completedAt ?? 0) : (b.releaseAt ?? 0) - (a.releaseAt ?? 0))
      || a.title.localeCompare(b.title));
    return StudentStudySessionsSchema.parse({
      counts: {
        waiting: sessions.filter((row) => row.state === 'new' || row.state === 'in_progress').length,
        upcoming: sessions.filter((row) => row.state === 'upcoming').length,
        done: sessions.filter((row) => row.state === 'done').length,
      },
      sessions,
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
      if (previous.completedAt === null && previous.checkSubmittedAt === null) {
        for (const conceptId of new Set(check.map((item) => item.content.conceptId))) {
          requireRemediationComplete(db, session.schoolId, profileId, conceptId);
        }
      }
      const stamp = previous.checkSubmittedAt ?? 0;
      const marks = check.map((item) => {
        const submitted = input.answers.find((entry) => entry.itemId === item.id)!;
        const correct = markItem(item.content, submitted.answer);
        const confidence = (submitted.confidence ?? 'unsure') as Confidence;
        const timeMs = submitted.timeMs ?? 0;
        const feedback = mistakeFor(item.content, submitted.answer);
        return { item, submitted, correct, confidence, timeMs, feedback, errorType: null as ErrorFamily | null };
      });
      const gate = sessionGate(marks.map((mark) => mark.correct));
      if (previous.completedAt === null) {
        for (const mark of marks) {
          if (mark.correct === null) continue;
          db.insert(learningEvidence).values({ id: `session:${session.id}:${profileId}:${mark.item.id}:${stamp}`,
            schoolId: session.schoolId, profileId, conceptId: mark.item.content.conceptId, correct: mark.correct, source: 'session', createdAt: now() })
            .onConflictDoNothing().run();
          const recorded = recordAnswer(db, {
            id: `session:${session.id}:${profileId}:${mark.item.id}:${stamp}`, schoolId: session.schoolId, profileId,
            conceptId: mark.item.content.conceptId, chapterId: session.chapterId, itemId: mark.item.id,
            level: clampLevel(mark.item.content.difficulty), correct: mark.correct, confidence: mark.confidence,
            source: mark.item.content.type === 'flashcard' ? 'flashcard' : 'session', timeMs: mark.timeMs,
            answer: mark.submitted.answer, markedFamily: mark.feedback.errorType, explanation: mark.feedback.explanation,
          }, now());
          mark.errorType = recorded.errorType;
          refreshConcept(db, { schoolId: session.schoolId, profileId, conceptId: mark.item.content.conceptId }, now());
        }
        const review = {
          score: gate.ratio, passed: gate.passed, bridge: gate.bridge,
          misses: marks.filter((mark) => mark.correct === false).map((mark) => ({
            itemId: mark.item.id, prompt: mark.item.content.prompt,
            explanation: mark.feedback.explanation ?? "Look at this idea again, then try a simpler question.",
            errorType: mark.errorType ?? 'concept_gap',
          })),
        };
        db.update(sessionProgress).set({
          checkSubmittedAt: previous.checkSubmittedAt ?? now(), lastReview: JSON.stringify(review),
          ...(gate.passed ? { completedAt: now() } : {}),
        }).where(and(eq(sessionProgress.sessionId, session.id), eq(sessionProgress.profileId, profileId))).run();
        if (gate.passed) touchStreak(db, profileId, session.schoolId, 'session_part', session.id, now());
      }
      if (gate.passed || previous.completedAt !== null) completeSession(allSlides.length, previous.viewedSlides, true);
      return sessionView(db, request, session);
    });
  });
}
