import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import type { GameId, SubmitPracticeAttempt } from '@vidhyasaathy/contracts';
import { requireAuth } from '../auth/middleware.ts';
import { chapterAccess } from '../content/access.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { attempts, items, practiceRounds } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { found, scope } from '../school/access.ts';
import { practiceSet, submitPractice } from './service.ts';

function ownRound(db: Db, request: FastifyRequest, id: string) {
  const { school, profile } = requireAuth(request);
  const round = found(db.select().from(practiceRounds).where(and(scope(practiceRounds, school.id, id), eq(practiceRounds.profileId, profile.id))).get());
  chapterAccess(db, request, round.chapterId);
  return round;
}

export function readRound(db: Db, request: FastifyRequest, id: string) {
  const round = ownRound(db, request, id);
  const answers = round.attemptIds.map((attemptId) => found(db.select().from(attempts).where(and(
    scope(attempts, round.schoolId, attemptId), eq(attempts.profileId, round.profileId),
  )).get()));
  const current = round.itemIds[answers.length];
  return { id: round.id, chapterId: round.chapterId, gameId: round.gameId, startedAt: round.createdAt,
    completed: answers.length === round.itemIds.length, answered: answers.length, total: round.itemIds.length,
    correct: answers.filter((row) => row.correct).length,
    item: current ? publicItem(found(db.select().from(items).where(scope(items, round.schoolId, current)).get())) : null,
    strip: round.itemIds.map((itemId, index) => ({ itemId,
      state: index < answers.length ? (answers[index]!.correct ? 'correct' : 'try_again') : index === answers.length ? 'current' : 'next' })),
  };
}

export function startRound(db: Db, request: FastifyRequest, chapterId: string, gameId: GameId, limit: number, now: number) {
  const { school, profile } = requireAuth(request);
  const set = practiceSet(db, request, chapterId, gameId, limit, now);
  if (!set.items.length) throw new ApiException(409, 'NO_PRACTICE', 'Your teacher has not shared practice for this chapter yet.');
  const id = randomUUID();
  db.insert(practiceRounds).values({ id, schoolId: school.id, profileId: profile.id, chapterId, gameId,
    itemIds: set.items.map((row) => row.item.id), attemptIds: [], createdAt: now }).run();
  return readRound(db, request, id);
}

export function answerRound(db: Db, request: FastifyRequest, id: string, input: SubmitPracticeAttempt, now: number) {
  const round = ownRound(db, request, id);
  const existing = db.select().from(attempts).where(eq(attempts.clientEventId, input.clientEventId)).get();
  if (existing ? !round.attemptIds.includes(existing.id) : round.itemIds[round.attemptIds.length] !== input.itemId) {
    throw new ApiException(409, 'ROUND_ORDER', 'Answer the current question once.');
  }
  const answer = submitPractice(db, request, input, now);
  if (!existing) db.update(practiceRounds).set({ attemptIds: [...round.attemptIds, answer.id] }).where(scope(practiceRounds, round.schoolId, round.id)).run();
  return { round: readRound(db, request, id), answer };
}
