import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { LearningContextSchema, LearningPlanSchema, TeachingModeSchema, type LearningEvent } from '@vidhyasaathy/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { chapterAccess } from '../content/access.ts';
import type { Database } from '../db/index.ts';
import { ApiException, parseInput } from '../errors.ts';
import { moduleBank, scoreAnswer } from '../learning/proto-content.ts';
import { gameRegistry } from '../learning/proto-games.ts';
import { schoolLearningModel, type JsonModel } from '../learning/proto-model.ts';
import { buildLearningPlan } from '../learning/proto-plan.ts';
import { prepareLearningStore, sessionPlan, type StudySession } from '../learning/proto-store.ts';
import { tutorReply } from '../learning/proto-tutor.ts';

const Id = z.string().min(1).max(200);
const ChapterInput = z.object({ chapterId: Id, subjectId: Id.optional() });

export async function registerLearningProtoRoutes(app: FastifyInstance, database: Database, now: () => number, model?: JsonModel) {
  await prepareLearningStore(database);
  const { db, sqlite } = database;
  const generateFor = (request: FastifyRequest): JsonModel => model ?? ((system, input) =>
    schoolLearningModel(database, requireAuth(request).school.id).generate(system, input));
  const student = { preHandler: requireRole('student') };
  const unavailable = () => new ApiException(404, 'NOT_FOUND', 'This learning resource is not available.');
  function bankFor(request: FastifyRequest, chapterId: string) {
    return moduleBank(db, requireAuth(request).school.id, chapterAccess(db, request, chapterId));
  }
  function ownedSession(request: FastifyRequest, id: string) {
    const { school, profile } = requireAuth(request);
    const row = sqlite.prepare('SELECT * FROM proto_study_session WHERE id=? AND school_id=? AND profile_id=?').get(id, school.id, profile.id) as StudySession | undefined;
    if (!row) throw unavailable();
    chapterAccess(db, request, row.chapter_id);
    return row;
  }
  function events(sessionId: string): LearningEvent[] {
    const rows = sqlite.prepare('SELECT * FROM proto_learning_event WHERE session_id=? ORDER BY ts,rowid').all(sessionId) as { id: string; session_id: string; type: string; concept_id: string; ts: string; result: string }[];
    return rows.map((row) => ({ id: row.id, sessionId: row.session_id, type: row.type, conceptId: row.concept_id, ts: row.ts, result: JSON.parse(row.result) as Record<string, unknown> }));
  }
  function sessionResponse(row: StudySession) { return { id: row.id, sessionId: row.id, chapterId: row.chapter_id, plan: sessionPlan(row), events: events(row.id) }; }
  function append(sessionId: string, type: string, conceptId: string, result: Record<string, unknown>, id: string = randomUUID()) {
    sqlite.prepare('INSERT INTO proto_learning_event VALUES (?,?,?,?,?,?)').run(id, sessionId, type, conceptId, new Date(now()).toISOString(), JSON.stringify(result));
    sqlite.prepare('UPDATE proto_study_session SET updated_at=? WHERE id=?').run(now(), sessionId);
    return id;
  }
  app.get('/learning/games', async (request) => {
    const registry = gameRegistry(db, requireAuth(request).school.id);
    return { games: registry.filter((row) => { try { chapterAccess(db, request, row.chapterId); return true; } catch { return false; } }) };
  });
  app.get('/learning/modules', async (request) => {
    const input = parseInput(ChapterInput, request.query);
    return { modules: bankFor(request, input.chapterId).modules };
  });
  app.get('/learning/modules/:id', async (request) => {
    const { id } = parseInput(z.object({ id: Id }), request.params);
    const chapterId = id.split(':topic:')[0]!;
    const module = bankFor(request, chapterId).modules.find((row) => row.id === id);
    if (!module) throw unavailable();
    return module;
  });
  app.post('/learning/plan', student, async (request) => {
    const input = parseInput(ChapterInput, request.body);
    const { school, profile } = requireAuth(request);
    const bank = bankFor(request, input.chapterId);
    const plan = await buildLearningPlan(bank.modules, gameRegistry(db, school.id).filter((row) => row.chapterId === input.chapterId), generateFor(request));
    sqlite.prepare('INSERT INTO proto_learning_plan VALUES (?,?,?,?,?)').run(plan.id, school.id, profile.id, input.chapterId, JSON.stringify(plan));
    return plan;
  });
  app.post('/learning/sessions', student, async (request) => {
    const input = parseInput(ChapterInput.extend({ planId: Id.optional(), sessionId: Id.optional() }), request.body);
    const { school, profile } = requireAuth(request);
    const bank = bankFor(request, input.chapterId);
    if (input.sessionId) {
      const row = ownedSession(request, input.sessionId);
      if (row.chapter_id !== input.chapterId) throw unavailable();
      return sessionResponse(row);
    }
    const existing = sqlite.prepare('SELECT * FROM proto_study_session WHERE school_id=? AND profile_id=? AND chapter_id=? ORDER BY updated_at DESC,rowid DESC LIMIT 1').get(school.id, profile.id, input.chapterId) as StudySession | undefined;
    if (existing && sessionPlan(existing).status !== 'completed' && (!input.planId || sessionPlan(existing).id === input.planId)) return sessionResponse(existing);
    const stored = input.planId ? sqlite.prepare('SELECT plan FROM proto_learning_plan WHERE id=? AND school_id=? AND profile_id=? AND chapter_id=?').get(input.planId, school.id, profile.id, input.chapterId) as { plan: string } | undefined : undefined;
    if (input.planId && !stored) throw unavailable();
    const plan = stored ? LearningPlanSchema.parse(JSON.parse(stored.plan)) : await buildLearningPlan(bank.modules, [], async () => { throw new Error('Deterministic start'); });
    const id = randomUUID();
    sqlite.prepare('INSERT INTO proto_study_session VALUES (?,?,?,?,?,?,?)').run(id, school.id, profile.id, input.chapterId, JSON.stringify(plan), now(), now());
    return sessionResponse(ownedSession(request, id));
  });
  app.get('/learning/sessions/:id', student, async (request) => sessionResponse(ownedSession(request, parseInput(z.object({ id: Id }), request.params).id)));
  app.get('/learning/sessions/:id/summary', student, async (request) => {
    const row = ownedSession(request, parseInput(z.object({ id: Id }), request.params).id);
    const history = events(row.id);
    const answers = history.filter((event) => event.type === 'answer_submitted');
    return { ...sessionResponse(row), attempted: answers.length, correct: answers.filter((event) => event.result?.correct === true).length,
      notTaught: answers.filter((event) => event.result?.notTaught === true).length,
      concepts: [...new Set(history.map((event) => event.conceptId))].map((conceptId) => {
        const latest = answers.filter((event) => event.conceptId === conceptId).at(-1);
        return { conceptId, word: latest?.result?.word ?? 'New' };
      }) };
  });
  app.post('/learning/sessions/:id/events', student, async (request) => {
    const row = ownedSession(request, parseInput(z.object({ id: Id }), request.params).id);
    const input = parseInput(z.object({ id: Id, type: z.enum(['module_opened', 'module_completed', 'explorer_changed', 'revision_requested']), moduleId: Id }), request.body);
    const bank = bankFor(request, row.chapter_id);
    const module = bank.modules.find((module) => module.id === input.moduleId);
    if (!module) throw unavailable();
    return sqlite.transaction(() => {
      const prior = sqlite.prepare('SELECT session_id,result FROM proto_learning_event WHERE id=?').get(input.id) as { session_id: string; result: string } | undefined;
      const result = { moduleId: module.id, eventType: input.type };
      if (prior) {
        if (prior.session_id !== row.id || prior.result !== JSON.stringify(result)) throw new ApiException(409, 'EVENT_CONFLICT', 'Use a new event ID for a different action.');
        return sessionResponse(ownedSession(request, row.id));
      }
      const plan = sessionPlan(ownedSession(request, row.id));
      if (input.type === 'module_completed') {
        if (plan.steps[plan.currentStep]?.moduleId !== module.id) throw new ApiException(409, 'STEP_ORDER', 'Complete the current step first.');
        if (module.type === 'practice' && module.questions?.length && !events(row.id).some((event) => event.type === 'answer_submitted' && event.result?.moduleId === module.id)) throw new ApiException(409, 'ANSWER_REQUIRED', 'Try a practice question before continuing.');
        plan.currentStep++;
        if (plan.currentStep >= plan.steps.length) plan.status = 'completed';
        sqlite.prepare('UPDATE proto_study_session SET plan=? WHERE id=?').run(JSON.stringify(plan), row.id);
      }
      append(row.id, input.type, module.conceptId, result, input.id);
      return sessionResponse(ownedSession(request, row.id));
    })();
  });
  app.post('/learning/modules/:id/answers', student, async (request) => {
    const { id } = parseInput(z.object({ id: Id }), request.params);
    const input = parseInput(z.object({ sessionId: Id, eventId: Id, questionId: Id, answer: z.string().min(1).max(2000) }), request.body);
    const row = ownedSession(request, input.sessionId);
    const bank = bankFor(request, row.chapter_id);
    const module = bank.modules.find((module) => module.id === id);
    const score = scoreAnswer(bank, id, input.questionId, input.answer);
    if (!module || !score) throw unavailable();
    return sqlite.transaction(() => {
      const result = { ...score, moduleId: id, questionId: input.questionId, answer: input.answer };
      const prior = sqlite.prepare('SELECT session_id,result FROM proto_learning_event WHERE id=?').get(input.eventId) as { session_id: string; result: string } | undefined;
      if (prior) {
        if (prior.session_id !== row.id || prior.result !== JSON.stringify(result)) throw new ApiException(409, 'EVENT_CONFLICT', 'Use a new event ID for a different answer.');
        return score;
      }
      // Each accepted answer is durable evidence, including not_taught without a penalty.
      append(row.id, 'answer_submitted', module.conceptId, result, input.eventId);
      return score;
    })();
  });
  app.post('/learning/tutor', student, async (request) => {
    const input = parseInput(z.object({ context: LearningContextSchema, mode: TeachingModeSchema, moduleId: Id,
      question: z.string().max(4000).default(''), answer: z.string().max(2000).nullable().default(null),
      lastWrongAttempt: z.object({ questionId: Id, answer: z.string().max(2000) }).nullable().default(null),
      plan: LearningPlanSchema.nullable().default(null) }), request.body);
    const { profile } = requireAuth(request);
    const row = ownedSession(request, input.context.sessionId);
    if (input.context.studentId !== profile.id || input.context.chapterId !== row.chapter_id) throw unavailable();
    const bank = bankFor(request, row.chapter_id);
    const module = bank.modules.find((module) => module.id === input.moduleId);
    if (!module || module.conceptId !== input.context.conceptId || module.subjectId !== input.context.subjectId) throw unavailable();
    const history = events(row.id).filter((event) => event.type === 'answer_submitted');
    const topicPrefix = module.id.slice(0, module.id.lastIndexOf(':') + 1);
    const lastWrong = history.filter((event) => String(event.result?.moduleId).startsWith(topicPrefix)
      && event.result?.correct === false && event.result?.notTaught !== true).at(-1);
    const result = await tutorReply({ ...input, module, relatedModules: bank.modules.filter((row) => row.id.startsWith(topicPrefix)), plan: sessionPlan(row),
      context: { ...input.context, step: sessionPlan(row).currentStep,
        recentAttempts: history.slice(-5).map((event) => ({ questionId: String(event.result?.questionId), answer: String(event.result?.answer), correct: event.result?.correct === true })) },
      lastWrongAttempt: lastWrong ? { questionId: String(lastWrong.result?.questionId), answer: String(lastWrong.result?.answer) } : null }, generateFor(request));
    append(row.id, 'tutor_requested', module.conceptId, { mode: input.mode, moduleId: module.id });
    return result;
  });
}
