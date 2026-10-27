import { randomUUID } from 'node:crypto';
import type { GameId, PracticeSet, SubmitPracticeAttempt } from '@vidhyasaathy/contracts';
import { gameModules } from '@vidhyasaathy/core/games';
import { interleave } from '@vidhyasaathy/core/interleaving';
import { streak } from '@vidhyasaathy/core/streak';
import { and, eq, lte } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireRemediationComplete } from '../ai/remediation-progress.ts';
import { attemptChanged, markItem } from '../assessment/service.ts';
import { requireAuth } from '../auth/middleware.ts';
import { chapterAccess } from '../content/access.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { assignmentItems, assignments, attempts, items, learningEvidence, learningSessions, profiles, studentConceptStates } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { found, scope } from '../school/access.ts';

function publishedItems(db: Db, request: FastifyRequest, timestamp: number, chapterId: string) {
  const { school, profile } = requireAuth(request);
  chapterAccess(db, request, chapterId);
  const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
  const common = and(eq(items.schoolId, school.id), eq(items.chapterId, chapterId));
  const sessionItems = db.select({ item: items }).from(items).innerJoin(learningSessions, eq(items.sessionId, learningSessions.id))
    .where(and(common, eq(learningSessions.sectionId, enrolled.sectionId ?? ''), eq(learningSessions.status, 'published'),
      lte(learningSessions.releaseAt, timestamp))).all();
  const assignedItems = db.select({ item: items }).from(items).innerJoin(assignmentItems, eq(assignmentItems.itemId, items.id))
    .innerJoin(assignments, eq(assignments.id, assignmentItems.assignmentId))
    .where(and(common, eq(assignments.sectionId, enrolled.sectionId ?? ''), eq(assignments.status, 'published'),
      lte(assignments.publishedAt, timestamp))).all();
  return [...new Map([...sessionItems, ...assignedItems].map(({ item }) => [item.id, item])).values()]
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

export function practiceSet(db: Db, request: FastifyRequest, chapterId: string, gameId: GameId, limit: number, timestamp: number): PracticeSet {
  const { school, profile } = requireAuth(request);
  const states = db.select().from(studentConceptStates).where(and(eq(studentConceptStates.schoolId, school.id),
    eq(studentConceptStates.profileId, profile.id))).all();
  const history = db.select().from(attempts).where(and(eq(attempts.schoolId, school.id), eq(attempts.profileId, profile.id))).all();
  const checks = db.select().from(learningEvidence).where(and(eq(learningEvidence.schoolId, school.id), eq(learningEvidence.profileId, profile.id))).all();
  const earlier = new Set([
    ...history.filter((row) => Math.min(row.clientTs, row.serverTs) <= timestamp - 7 * 86400000).map((row) => row.conceptId),
    ...checks.filter((row) => row.createdAt <= timestamp - 7 * 86400000).map((row) => row.conceptId),
  ]);
  const due = new Set(states.filter((row) => row.nextReview <= timestamp && earlier.has(row.conceptId)).map((row) => row.conceptId));
  const accepted = gameModules[gameId].acceptedItemTypes;
  const eligible = publishedItems(db, request, timestamp, chapterId).filter((row) => accepted.includes(row.content.type));
  const fresh = eligible.filter((row) => !earlier.has(row.conceptId));
  const review = eligible.filter((row) => due.has(row.conceptId));
  return { chapterId, gameId, required: false, updatedAt: timestamp,
    items: interleave(fresh, review, limit).map(({ item, kind }) => ({ item: publicItem(item), kind })) };
}

export function submitPractice(db: Db, request: FastifyRequest, input: SubmitPracticeAttempt, timestamp: number) {
  const { school, profile } = requireAuth(request);
  const existing = db.select().from(attempts).where(eq(attempts.clientEventId, input.clientEventId)).get();
  if (existing && (existing.schoolId !== school.id || existing.profileId !== profile.id || existing.assignmentId !== null
    || existing.itemId !== input.itemId || existing.timeMs !== input.timeMs || existing.clientTs !== input.clientTs
    || JSON.stringify(existing.answer) !== JSON.stringify(input.answer))) {
    throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID has already been used for a different answer.');
  }
  const item = found(db.select().from(items).where(scope(items, school.id, input.itemId)).get());
  found(publishedItems(db, request, timestamp, item.chapterId).find((row) => row.id === item.id));
  if (existing) return existing;
  requireRemediationComplete(db, school.id, profile.id, item.conceptId);
  const correct = markItem(item.content, input.answer);
  if (correct === null) throw new ApiException(400, 'UNMARKED_PRACTICE', 'Use a teacher assignment for answers that need review.');
  const row = db.insert(attempts).values({ ...input, id: randomUUID(), schoolId: school.id, profileId: profile.id,
    assignmentId: null, conceptId: item.conceptId, correct, needsReview: false, serverTs: timestamp, updatedAt: timestamp }).returning().get()!;
  attemptChanged(db, row, timestamp);
  return row;
}

export function practiceStreak(db: Db, request: FastifyRequest, timestamp: number) {
  const { school, profile } = requireAuth(request);
  const answers = db.select().from(attempts).where(and(eq(attempts.schoolId, school.id), eq(attempts.profileId, profile.id), eq(attempts.correct, true))).all();
  const checks = db.select().from(learningEvidence).where(and(eq(learningEvidence.schoolId, school.id), eq(learningEvidence.profileId, profile.id),
    eq(learningEvidence.correct, true))).all();
  return streak([...answers.map((row) => Math.min(row.clientTs, row.serverTs)), ...checks.map((row) => row.createdAt)], timestamp);
}
