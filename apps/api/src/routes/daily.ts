import {
  BadgeSeenSchema, BadgeShelfSchema, CatchupDoneSchema, CatchupSchema, DailyChallengeAnswerResultSchema,
  DailyChallengeAnswerSchema, DailyChallengeFinishSchema, DailyChallengeSchema, DailyClientSchema,
  DushmanListSchema, HomeworkDraftSavedSchema, HomeworkListSchema, HomeworkQuerySchema, PlanItemDoneSchema,
  SaveHomeworkDraftSchema, SaveStudentStudyPlanSchema, StudentHomeSchema, StudentStreakSchema,
  StudentStudyPlanSchema, WarmupCompleteSchema, WarmupDoneSchema, WarmupSkipResultSchema, WarmupStartSchema,
} from '@vidhyasaathy/contracts';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { requireRole } from '../auth/middleware.ts';
import type { Db } from '../db/index.ts';
import {
  answerChallenge, completeCatchup, completePlanItem, completeWarmup, finishChallenge, saveHomeworkDraft,
  saveStudyPlan, seeBadge, serveChallenge, skipWarmup, startWarmup, studentBadges, studentCatchup,
  studentDushman, studentHome, studentHomework, studentStreak, studentStudyPlan,
} from '../daily/service.ts';
import { parseInput } from '../errors.ts';
import { mutate } from '../school/access.ts';

const AwardParams = z.object({ id: z.string().trim().min(1).max(200) }).strict();

export function registerDailyRoutes(app: FastifyInstance, db: Db, now: () => number) {
  const student = { preHandler: requireRole('student') };
  app.get('/student/home', student, async (request) => StudentHomeSchema.parse(studentHome(db, request, now())));
  app.post('/student/warmup/start', student, async (request) => {
    const input = parseInput(DailyClientSchema, request.body);
    return mutate(() => WarmupStartSchema.parse(startWarmup(db, request, input.clientEventId, now())));
  });
  app.post('/student/warmup/skip', student, async (request) => {
    const input = parseInput(DailyClientSchema, request.body);
    return mutate(() => WarmupSkipResultSchema.parse(skipWarmup(db, request, input.clientEventId, now())));
  });
  app.post('/student/warmup/:id/complete', student, async (request) => {
    const input = parseInput(WarmupCompleteSchema, request.body);
    const { id } = parseInput(AwardParams, request.params);
    return mutate(() => WarmupDoneSchema.parse(completeWarmup(db, request, id, input.ratings, input.clientEventId, now())));
  });
  app.get('/student/catchup', student, async (request) => mutate(() => CatchupSchema.parse(studentCatchup(db, request, now()))));
  app.post('/student/catchup/complete', student, async (request) => {
    const input = parseInput(DailyClientSchema, request.body);
    return mutate(() => CatchupDoneSchema.parse(completeCatchup(db, request, input.clientEventId, now())));
  });
  app.get('/student/daily-challenge', student, async (request) => mutate(() => DailyChallengeSchema.parse(serveChallenge(db, request, now()))));
  app.post('/student/daily-challenge/:id/answer', student, async (request) => {
    const input = parseInput(DailyChallengeAnswerSchema, request.body);
    const { id } = parseInput(AwardParams, request.params);
    return mutate(() => DailyChallengeAnswerResultSchema.parse(answerChallenge(db, request, id, input, now())));
  });
  app.post('/student/daily-challenge/:id/finish', student, async (request) => {
    const { id } = parseInput(AwardParams, request.params);
    return mutate(() => DailyChallengeFinishSchema.parse(finishChallenge(db, request, id, now())));
  });
  app.get('/student/dushman', student, async (request) => mutate(() => DushmanListSchema.parse(studentDushman(db, request, now()))));
  app.get('/student/study-plan', student, async (request) => mutate(() => StudentStudyPlanSchema.parse(studentStudyPlan(db, request, now()))));
  app.post('/student/study-plan', student, async (request) => {
    const input = parseInput(SaveStudentStudyPlanSchema, request.body);
    return mutate(() => StudentStudyPlanSchema.parse(saveStudyPlan(db, request, input, now())));
  });
  app.post('/student/study-plan/items/:id/done', student, async (request) => {
    const { id } = parseInput(AwardParams, request.params);
    return mutate(() => PlanItemDoneSchema.parse(completePlanItem(db, request, id, now())));
  });
  app.get('/student/streak', student, async (request) => StudentStreakSchema.parse(studentStreak(db, request, now())));
  app.get('/student/badges', student, async (request) => BadgeShelfSchema.parse(studentBadges(db, request)));
  app.post('/student/badges/:id/seen', student, async (request) => {
    const { id } = parseInput(AwardParams, request.params);
    return mutate(() => BadgeSeenSchema.parse(seeBadge(db, request, id, now())));
  });
  app.get('/student/homework', student, async (request) => {
    const query = parseInput(HomeworkQuerySchema, request.query);
    return HomeworkListSchema.parse(studentHomework(db, request, query.tab, now()));
  });
  app.put('/student/homework/:id/draft', student, async (request) => {
    const input = parseInput(SaveHomeworkDraftSchema, request.body);
    const { id } = parseInput(AwardParams, request.params);
    return mutate(() => HomeworkDraftSavedSchema.parse(saveHomeworkDraft(db, request, id, input.itemId, input.answer, now())));
  });
}
