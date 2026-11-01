import { PracticeNextSchema, PracticeQuerySchema, SubmitPracticeAttemptSchema } from '@vidhyasaathy/contracts';
import type { FastifyInstance } from 'fastify';
import { requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import { resourceId } from '../content/access.ts';
import type { Db } from '../db/index.ts';
import { parseInput } from '../errors.ts';
import { practiceNext, practiceSet, practiceStreak, submitPractice } from '../practice/service.ts';
import { answerRound, readRound, startRound } from '../practice/rounds.ts';
import { mutate } from '../school/access.ts';

export function registerPracticeRoutes(app: FastifyInstance, db: Db, auth: AuthService, now: () => number) {
  const student = { preHandler: requireRole('student'), bodyLimit: 16 * 1024 };
  app.post('/chapters/:id/quiz-rounds', student, async (request) => {
    const input = parseInput(PracticeQuerySchema, request.body);
    return mutate(() => db.transaction(() => startRound(db, request, resourceId(request), input.gameId, input.limit, now())));
  });
  app.get('/quiz-rounds/:id', student, async (request) => readRound(db, request, resourceId(request)));
  app.post('/quiz-rounds/:id/answer', student, async (request) => {
    const input = parseInput(SubmitPracticeAttemptSchema, request.body);
    return mutate(() => db.transaction(() => answerRound(db, request, resourceId(request), input, now())));
  });
  app.get('/chapters/:id/practice/next', student, async (request) => PracticeNextSchema.parse(practiceNext(db, request, resourceId(request), now())));
  app.get('/chapters/:id/practice', student, async (request) => {
    const query = parseInput(PracticeQuerySchema, request.query);
    return practiceSet(db, request, resourceId(request), query.gameId, query.limit, now(), query.concept ?? null);
  });
  app.post('/practice/attempts', student, async (request) => {
    const input = parseInput(SubmitPracticeAttemptSchema, request.body);
    return mutate(() => db.transaction(() => {
      const result = submitPractice(db, request, input, now());
      auth.audit(request, 'practice.attempt');
      return result;
    }));
  });
  app.get('/practice/streak', student, async (request) => practiceStreak(db, request, now()));
}
