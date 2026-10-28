import { SubmitRemediationSchema, type PlanItem, type RemediationResult } from '@vidhyasaathy/contracts';
import { buildStudyPlan } from '@vidhyasaathy/core/study-plan';
import { and, eq, lte } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { assignmentFilter, assignmentQuestions, assignmentView, markItem, refreshConcept } from '../assessment/service.ts';
import { conceptAccess, prerequisiteGap, remediationState } from '../ai/remediation.ts';
import { digest } from '../ai/retrieval.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { resourceId } from '../content/access.ts';
import { hasSlides, progressRow, sessionSlides } from '../content/sessions.ts';
import type { Database } from '../db/index.ts';
import { assignments, attempts, chapters, concepts, learningEvidence, learningSessions, profiles, remediationChecks, studentConceptStates } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, scope } from '../school/access.ts';

export function registerRemediationRoutes(app: FastifyInstance, database: Database, now: () => number) {
  const { db } = database;
  const student = { preHandler: requireRole('student') };
  app.get('/concepts/:id/gap', student, async (request) => {
    const concept = conceptAccess(database, request, resourceId(request));
    const { school, profile } = requireAuth(request);
    return prerequisiteGap(database, school.id, profile.id, concept.id);
  });
  app.get('/concepts/:id/remediation', student, async (request) => {
    return remediationState(database, request, resourceId(request), now()).view;
  });
  app.post('/concepts/:id/remediation/check', { ...student, config: { rateLimit: {
    max: 20, timeWindow: 60000, keyGenerator: (request: FastifyRequest) => `remediation:${request.auth?.profile.id ?? request.ip}`,
  } } }, async (request) => {
    const input = parseInput(SubmitRemediationSchema, request.body);
    const conceptId = resourceId(request);
    conceptAccess(database, request, conceptId);
    const { school, profile } = requireAuth(request);
    const inputHash = digest({ conceptId, answers: [...input.answers].sort((a, b) => a.itemId.localeCompare(b.itemId)) });
    return db.transaction(() => {
      const previous = db.select().from(remediationChecks).where(eq(remediationChecks.clientEventId, input.clientEventId)).get();
      if (previous) {
        if (previous.schoolId !== school.id || previous.profileId !== profile.id || previous.inputHash !== inputHash) {
          throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another check.');
        }
        return previous.result;
      }
      const state = remediationState(database, request, conceptId, now());
      if (state.view.status !== 'ready' || !state.failureId) throw new ApiException(409, 'CHECK_UNAVAILABLE', 'No remediation check is available.');
      if (!state.questions.every((item) => input.answers.some((answer) => answer.itemId === item.id))) {
        throw new ApiException(400, 'INVALID_CHECK', 'Answer the two questions in this remediation.');
      }
      const marks = state.questions.map((item) => ({ item, correct: markItem(item.content, input.answers.find((answer) => answer.itemId === item.id)!.answer) === true }));
      const correct = marks.filter((mark) => mark.correct).length;
      const checkAttempt = state.checks.length + 1;
      const result: RemediationResult = { clientEventId: input.clientEventId, conceptId, targetConceptId: state.target.id,
        correct, passed: correct === 2, checkAttempt, passedOnSecondAttempt: correct === 2 && checkAttempt === 2, updatedAt: now() };
      db.insert(remediationChecks).values({ clientEventId: input.clientEventId, schoolId: school.id, profileId: profile.id,
        conceptId, targetConceptId: state.target.id, failureId: state.failureId, inputHash, result, createdAt: now() }).run();
      for (const mark of marks) db.insert(learningEvidence).values({ id: `remediation:${input.clientEventId}:${mark.item.id}`,
        schoolId: school.id, profileId: profile.id, conceptId: state.target.id, correct: mark.correct, source: 'remediation', createdAt: now() }).run();
      refreshConcept(db, { schoolId: school.id, profileId: profile.id, conceptId: state.target.id }, now());
      return result;
    });
  });
  app.get('/study-plan', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
    const plan: PlanItem[] = [];
    for (const { assignment } of db.select({ assignment: assignments }).from(assignments).innerJoin(chapters, eq(chapters.id, assignments.chapterId))
      .where(assignmentFilter(db, request)).all()) {
      const summary = assignmentView(db, request, assignment);
      if (summary.score?.status === 'completed' || summary.score?.status === 'pending_review') continue;
      const questions = assignmentQuestions(db, assignment.id);
      const answered = new Set(db.select({ itemId: attempts.itemId }).from(attempts).where(and(eq(attempts.assignmentId, assignment.id), eq(attempts.profileId, profile.id))).all().map((row) => row.itemId));
      plan.push({ id: assignment.id, chapterId: assignment.chapterId, title: assignment.title, kind: 'assignment', required: true,
        dueAt: assignment.dueAt, resumeAt: Math.max(0, questions.findIndex((item) => !answered.has(item.id))) });
    }
    for (const session of db.select().from(learningSessions).where(and(eq(learningSessions.schoolId, school.id),
      eq(learningSessions.sectionId, enrolled.sectionId ?? ''), eq(learningSessions.status, 'published'), lte(learningSessions.releaseAt, now()))).all()) {
      const progress = progressRow(db, session.id, profile.id);
      if (progress?.completedAt != null || !hasSlides(db, session.id)) continue;
      plan.push({ id: session.id, chapterId: session.chapterId, title: session.title, kind: 'session', required: true, dueAt: null,
        resumeAt: Math.min(progress?.viewedSlides ?? 0, sessionSlides(db, session.id).length) });
    }
    const states = db.select({ state: studentConceptStates, concept: concepts }).from(studentConceptStates)
      .innerJoin(concepts, eq(concepts.id, studentConceptStates.conceptId)).where(and(eq(studentConceptStates.schoolId, school.id), eq(studentConceptStates.profileId, profile.id))).all();
    for (const { state, concept } of states) {
      // Old class data must not leak into a plan after a section move.
      const visible = database.sqlite.prepare(`SELECT 1 FROM chapter c JOIN subject s ON s.id = c.subject_id
        JOIN section sec ON sec.class_id = s.class_id AND sec.school_id = s.school_id
          WHERE c.id = ? AND c.school_id = ? AND sec.id = ?`).get(concept.chapterId, school.id, enrolled.sectionId ?? '');
      if (!visible) continue;
      const remediation = remediationState(database, request, concept.id, now()).view;
      if (remediation.status === 'ready') {
        plan.push({ id: concept.id, chapterId: concept.chapterId, title: remediation.title, kind: 'remediation', required: false, dueAt: null, resumeAt: 0 });
      } else if (state.nextReview <= now()) {
        const material = database.sqlite.prepare(`SELECT 1 FROM note n JOIN note_concept nc ON nc.note_id = n.id
          WHERE nc.concept_id = ? AND n.school_id = ? AND n.status = 'published' AND n.release_at <= ? LIMIT 1`)
          .get(concept.id, school.id, now());
        if (material) plan.push({ id: concept.id, chapterId: concept.chapterId, title: concept.title, kind: 'review', required: false, dueAt: state.nextReview, resumeAt: 0 });
      }
    }
    return { ...buildStudyPlan(plan, now()), updatedAt: now() };
  });
}
