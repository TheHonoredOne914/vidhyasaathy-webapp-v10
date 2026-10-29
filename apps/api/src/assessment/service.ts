import { randomUUID } from 'node:crypto';
import type { Answer, Assignment, SaveItem, SubmitAttempt } from '@vidhyasaathy/contracts';
import { clampLevel } from '@vidhyasaathy/core/learning';
import { calculateMastery } from '@vidhyasaathy/core/mastery';
import { and, eq, exists, isNull } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import { remediationProgress, requireRemediationComplete } from '../ai/remediation-progress.ts';
import { chapterAccess } from '../content/access.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { mistakeFor, recordAnswer } from '../learning/record.ts';
import { assignmentItems, assignments, attempts, chapters, items, learningEvidence, profiles, studentConceptStates, syncChanges, teacherAssignments } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { found, scope } from '../school/access.ts';

export function assignmentFilter(db: Db, request: FastifyRequest) {
  const { school, profile } = requireAuth(request);
  const enrolled = profile.role === 'student' ? found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get()) : null;
  return and(eq(assignments.schoolId, school.id),
    profile.role === 'student' ? and(eq(assignments.status, 'published'), eq(assignments.sectionId, enrolled?.sectionId ?? '')) : undefined,
    profile.role === 'teacher' ? exists(db.select({ id: teacherAssignments.id }).from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id),
      eq(teacherAssignments.sectionId, assignments.sectionId), eq(teacherAssignments.subjectId, chapters.subjectId),
    ))) : undefined);
}

export function assignmentAccess(db: Db, request: FastifyRequest, id: string, write = false) {
  const row = found(db.select().from(assignments).where(scope(assignments, requireAuth(request).school.id, id)).get());
  chapterAccess(db, request, row.chapterId, write, row.sectionId);
  if (requireAuth(request).profile.role === 'student' && row.status !== 'published') {
    throw new ApiException(403, 'CONTENT_UNAVAILABLE', 'This assignment has not been published.');
  }
  return row;
}

export function assignmentQuestions(db: Db, id: string) {
  return db.select({ id: items.id, schoolId: items.schoolId, chapterId: items.chapterId, sessionId: items.sessionId,
    content: items.content, position: assignmentItems.position }).from(assignmentItems)
    .innerJoin(items, eq(items.id, assignmentItems.itemId)).where(eq(assignmentItems.assignmentId, id)).orderBy(assignmentItems.position).all();
}

export function assignmentView(db: Db, request: FastifyRequest, row: typeof assignments.$inferSelect, studentId?: string): Assignment {
  const questions = assignmentQuestions(db, row.id);
  const teacher = found(db.select().from(profiles).where(scope(profiles, row.schoolId, row.teacherId)).get());
  const summary = { ...row, teacherName: teacher.name, required: true as const, itemIds: questions.map((item) => item.id) };
  const profileId = studentId ?? (requireAuth(request).profile.role === 'student' ? requireAuth(request).profile.id : null);
  if (!profileId) return { ...summary, score: null };
  const answers = db.select().from(attempts).where(and(eq(attempts.assignmentId, row.id), eq(attempts.profileId, profileId))).all();
  const pending = answers.some((answer) => answer.needsReview);
  const status = !answers.length ? 'not_started' : answers.length < questions.length ? 'in_progress' : pending ? 'pending_review' : 'completed';
  return { ...summary, score: { answered: answers.length, marked: answers.filter((a) => !a.needsReview).length,
    correct: answers.filter((a) => a.correct === true).length, total: questions.length, status } };
}

export function assignmentDetail(db: Db, request: FastifyRequest, row: typeof assignments.$inferSelect) {
  const questions = assignmentQuestions(db, row.id);
  return { ...assignmentView(db, request, row), items: requireAuth(request).profile.role === 'student'
    ? questions.map(publicItem) : questions.map(({ id, schoolId, chapterId, content }) => ({ id, schoolId, chapterId, content })) };
}

export function recordChange(db: Db, schoolId: string, stream: typeof syncChanges.$inferInsert.stream, entityId: string,
  assignmentId: string | null = null, profileId: string | null = null) {
  db.insert(syncChanges).values({ schoolId, stream, entityId, assignmentId, profileId }).run();
}

export function markItem(item: SaveItem, answer: Answer): boolean | null {
  if (item.type === 'match_pairs') {
    if (!Array.isArray(answer) || answer.length !== item.pairs.length || new Set(answer).size !== answer.length
      || answer.some((value) => !item.pairs.some((pair) => pair.right === value))) {
      throw new ApiException(400, 'INVALID_ANSWER', 'Match each left value to one distinct right value.');
    }
    return item.pairs.every((pair, index) => pair.right === answer[index]);
  }
  if (typeof answer !== 'string' || (item.type === 'mcq' && !item.options.includes(answer))) {
    throw new ApiException(400, 'INVALID_ANSWER', 'Choose an answer in the question’s format.');
  }
  const normalize = (value: string) => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  if (item.type === 'mcq') return answer === item.answer;
  // Exact accepted answers are auto-marked; other prose goes to the teacher, never an invented semantic grade.
  if (item.type === 'short_answer') return item.acceptedAnswers.some((value) => normalize(value) === normalize(answer)) ? true : null;
  return normalize(answer) === normalize(item.answer);
}

export function refreshConcept(db: Db, attempt: Pick<typeof attempts.$inferSelect, 'schoolId' | 'profileId' | 'conceptId'>, timestamp: number) {
  const evidence = db.select().from(attempts).where(and(eq(attempts.schoolId, attempt.schoolId),
    eq(attempts.profileId, attempt.profileId), eq(attempts.conceptId, attempt.conceptId))).all()
    .filter((row): row is typeof row & { correct: boolean } => row.correct !== null)
    .map((row) => ({ clientEventId: row.clientEventId, correct: row.correct, timestamp: Math.min(row.clientTs, row.serverTs) }));
  evidence.push(...db.select().from(learningEvidence).where(and(eq(learningEvidence.schoolId, attempt.schoolId),
    eq(learningEvidence.profileId, attempt.profileId), eq(learningEvidence.conceptId, attempt.conceptId))).all()
    .map((row) => ({ clientEventId: `learning:${row.id}`, correct: row.correct, timestamp: row.createdAt })));
  if (!evidence.length) return;
  const state = { schoolId: attempt.schoolId, profileId: attempt.profileId, conceptId: attempt.conceptId,
    ...calculateMastery(evidence), updatedAt: timestamp };
  db.insert(studentConceptStates).values(state).onConflictDoUpdate({
    target: [studentConceptStates.profileId, studentConceptStates.conceptId], set: state,
  }).run();
  recordChange(db, attempt.schoolId, 'conceptStates', attempt.conceptId, null, attempt.profileId);
}

export function attemptChanged(db: Db, row: typeof attempts.$inferSelect, timestamp: number) {
  if (row.assignmentId !== null) {
    recordChange(db, row.schoolId, 'attempts', row.id, row.assignmentId, row.profileId);
    recordChange(db, row.schoolId, 'assignments', row.assignmentId, row.assignmentId, row.profileId);
  }
  refreshConcept(db, row, timestamp);
}

// Call inside the request transaction: attempts, scores, mastery and sync receipts commit together.
export function submitAttempt(db: Db, request: FastifyRequest, input: SubmitAttempt, timestamp: number) {
  const { profile, school } = requireAuth(request);
  const existing = db.select().from(attempts).where(eq(attempts.clientEventId, input.clientEventId)).get();
  if (existing && (existing.profileId !== profile.id || existing.schoolId !== school.id
    || existing.assignmentId !== input.assignmentId || existing.itemId !== input.itemId
    || existing.timeMs !== input.timeMs || existing.clientTs !== input.clientTs || JSON.stringify(existing.answer) !== JSON.stringify(input.answer))) {
    throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID has already been used for a different answer.');
  }
  const assignment = assignmentAccess(db, request, input.assignmentId);
  if (existing) return existing;
  const question = found(assignmentQuestions(db, assignment.id).find((item) => item.id === input.itemId));
  // A wrong answer still lets the student finish that assignment. Remediation blocks the next one.
  const progress = remediationProgress(db, school.id, profile.id, question.content.conceptId);
  const openFailure = progress.failureId?.startsWith('attempt:')
    ? db.select().from(attempts).where(eq(attempts.id, progress.failureId.slice('attempt:'.length))).get() : undefined;
  if (openFailure?.assignmentId !== input.assignmentId) requireRemediationComplete(db, school.id, profile.id, question.content.conceptId);
  const correct = markItem(question.content, input.answer);
  const { confidence, ...attemptInput } = input;
  const row = db.insert(attempts).values({
    ...attemptInput, id: randomUUID(), schoolId: school.id, profileId: profile.id, conceptId: question.content.conceptId,
    correct, needsReview: correct === null, serverTs: timestamp, updatedAt: timestamp,
  }).returning().get()!;
  attemptChanged(db, row, timestamp);
  if (correct !== null) {
    const feedback = mistakeFor(question.content, input.answer);
    recordAnswer(db, {
      id: `attempt:${row.clientEventId}`, schoolId: school.id, profileId: profile.id, conceptId: question.content.conceptId,
      chapterId: question.chapterId, itemId: question.id, level: clampLevel(question.content.difficulty), correct,
      confidence: confidence ?? 'unsure', source: assignment.kind === 'quiz' ? 'quiz' : 'homework', timeMs: input.timeMs,
      answer: input.answer, markedFamily: feedback.errorType, explanation: feedback.explanation,
    }, timestamp);
  }
  return row;
}

export function bankItem(db: Db, request: FastifyRequest, id: string) {
  const row = found(db.select().from(items).where(and(scope(items, requireAuth(request).school.id, id), isNull(items.sessionId))).get());
  chapterAccess(db, request, row.chapterId, true);
  return row;
}
