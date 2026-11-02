import { randomUUID } from 'node:crypto';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameRegistryEntrySchema, LearningModuleSchema, LearningPlanSchema, TutorResponseSchema } from '@vidhyasaathy/contracts';
import { buildLearningPlan } from '../src/learning/proto-plan.ts';
import { moduleBank, scoreAnswer } from '../src/learning/proto-content.ts';
import { gameRegistry } from '../src/learning/proto-games.ts';
import { MODE_PROMPTS, tutorReply } from '../src/learning/proto-tutor.ts';
import { prepareLearningStore } from '../src/learning/proto-store.ts';
import { learningSettings, prepareLearningSettings } from '../src/learning/proto-settings.ts';
import type { JsonModel } from '../src/learning/proto-model.ts';
import { openDatabase } from '../src/db/index.ts';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { seedPhase4 } from '../src/db/seed-phase4.ts';
import { chapters } from '../src/db/schema.ts';
import { cookieFrom, createHarness, ORIGIN, PASSWORD, PIN, type Harness } from './helpers.ts';

const offline = async () => { throw new Error('offline'); };
let h: Harness | undefined;
afterEach(async () => { if (h) { await h.app.close(); h = undefined; } vi.unstubAllEnvs(); });
async function setup(learningModel: JsonModel = offline) {
  h = await createHarness({ learningModel });
  await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  vi.stubEnv('DEMO_LOOSE_AUTH', 'true');
  const login = await h.post('/auth/demo/student', {});
  expect(login.statusCode).toBe(200);
  const cookie = cookieFrom(login.headers);
  const catalog = h.database.db.select().from(chapters).all();
  const chapter = catalog.find((row) => row.title === 'Motion')!;
  const bank = moduleBank(h.database.db, DEMO_SCHOOL_ID, chapter);
  return { cookie, chapter, bank };
}

describe('learning prototype', () => {
  it('keeps founder credentials masked, school scoped and writable only by administrators', async () => {
    const { cookie } = await setup();
    const admin = h!.roleCookie(DEMO_SCHOOL_ID, 'admin').cookie;
    const put = (payload: Record<string, unknown>, role = admin) => h!.app.inject({
      method: 'PUT', url: '/founder/settings', headers: { cookie: role, origin: ORIGIN }, payload,
    });
    expect((await put({ geminiApiKey: 'test-founder-secret' }, cookie)).statusCode).toBe(403);
    const saved = await put({ geminiApiKey: 'test-founder-secret', geminiModel: 'gemini-2.5-flash' });
    expect(saved.statusCode).toBe(200);
    expect(saved.json()).toMatchObject({ geminiConfigured: true, geminiKeyMasked: '********cret', source: 'founder' });
    expect(saved.body).not.toContain('test-founder-secret');
    expect((await put({ geminiModel: 'another-model' })).json().geminiConfigured).toBe(true);
    const otherAdmin = cookieFrom((await h!.register('another-admin@example.test')).headers);
    const other = await h!.app.inject({ url: '/founder/settings', headers: { cookie: otherAdmin } });
    expect(other.json().source).not.toBe('founder');
    expect((await put({ geminiApiKey: null })).json().source).not.toBe('founder');
  });
  it('builds schema-valid flagship and generic modules without exposing keys', async () => {
    const { bank } = await setup();
    const catalog = h!.database.db.select().from(chapters).all();
    for (const chapter of catalog) {
      const current = moduleBank(h!.database.db, chapter.schoolId, chapter);
      expect(current.modules.length).toBeGreaterThanOrEqual(6);
      current.modules.forEach((module) => LearningModuleSchema.parse(module));
      expect(JSON.stringify(current.modules)).not.toMatch(/"(?:answer|acceptedAnswers)":/);
    }
    expect(new Set(bank.modules.map((module) => module.type)).size).toBe(6);
    expect(bank.modules.some((module) => module.content.includes('s = ut'))).toBe(true);
    expect(bank.modules.some((module) => module.content.includes('uniform circular motion'))).toBe(true);
    const coordinate = moduleBank(h!.database.db, DEMO_SCHOOL_ID, { id: 'geometry', subjectId: 'maths', title: 'Coordinate Geometry' });
    expect(coordinate.modules.length).toBe(18);
    expect(coordinate.modules.some((module) => module.content.includes('quadrant II'))).toBe(true);
  });

  it('scores deterministically, distinguishes not_taught, and refuses unrelated keys', async () => {
    const { bank } = await setup();
    const practice = bank.modules.find((module) => module.type === 'practice')!;
    const question = practice.questions![0]!;
    expect(scoreAnswer(bank, practice.id, question.id, '10 m and 0 m')?.correct).toBe(true);
    expect(scoreAnswer(bank, practice.id, question.id, '0 m and 10 m')?.correct).toBe(false);
    expect(scoreAnswer(bank, practice.id, question.id, "Haven't learned this yet")).toMatchObject({ notTaught: true, word: 'New' });
    expect(scoreAnswer(bank, bank.modules[0]!.id, question.id, '10 m and 0 m')).toBeNull();
  });

  it('retries invalid plan JSON once then returns the full labelled fallback', async () => {
    const { bank } = await setup();
    const invalid = vi.fn(async () => ({ steps: 'not a plan' }));
    const plan = LearningPlanSchema.parse(await buildLearningPlan(bank.modules, [], invalid));
    expect(invalid).toHaveBeenCalledTimes(2);
    expect(plan.status).toBe('fallback');
    expect(plan.steps.map((step) => step.moduleId)).toEqual(bank.modules.map((module) => module.id));
  });

  it('accepts a valid model plan and replaces invented or cross-chapter IDs', async () => {
    const { bank } = await setup();
    const fallback = await buildLearningPlan(bank.modules, [], offline);
    const valid = await buildLearningPlan(bank.modules, [], async () => ({ ...fallback, status: 'active', currentStep: 800 }));
    expect(valid.status).toBe('active');
    expect(valid.currentStep).toBe(0);
    const repaired = await buildLearningPlan(bank.modules, [], async () => ({ ...fallback, steps: fallback.steps.map((step, index) => index === 0 ? { moduleId: 'invented', activityId: 'external-game' } : step) }));
    expect(repaired.status).toBe('fallback');
    expect(repaired.steps[0]).toEqual({ moduleId: bank.modules[0]!.id });
    expect(JSON.stringify(repaired)).not.toContain('external-game');
  });

  it('registers only real games with chapter and concept mappings', async () => {
    const { chapter } = await setup();
    await seedPhase4(h!.database, h!.now);
    const registry = gameRegistry(h!.database.db, DEMO_SCHOOL_ID);
    registry.forEach((game) => GameRegistryEntrySchema.parse(game));
    expect(registry.find((game) => game.id === 'motion')?.chapterId).toBe(chapter.id);
    expect(registry.some((game) => game.id === 'maths-war')).toBe(true);
    expect(registry.some((game) => game.id === 'tinker')).toBe(true);
    expect(registry.every((game) => game.route.startsWith('/student/') && game.conceptIds.length > 0)).toBe(true);
    expect(registry.some((game) => game.route.includes('final.html'))).toBe(false);
  });

  it('persists answers and progress, resumes sessions and prevents forged or duplicate evidence', async () => {
    const { cookie, chapter, bank } = await setup();
    const start = await h!.post('/learning/sessions', { chapterId: chapter.id }, cookie);
    expect(start.statusCode).toBe(200);
    const session = start.json();
    const resume = await h!.post('/learning/sessions', { chapterId: chapter.id }, cookie);
    expect(resume.json().sessionId).toBe(session.sessionId);
    const module = bank.modules[0]!;
    const complete = { id: randomUUID(), type: 'module_completed', moduleId: module.id };
    expect((await h!.post(`/learning/sessions/${session.sessionId}/events`, complete, cookie)).json().plan.currentStep).toBe(1);
    expect((await h!.post(`/learning/sessions/${session.sessionId}/events`, complete, cookie)).json().plan.currentStep).toBe(1);
    const practice = bank.modules.find((module) => module.type === 'practice')!;
    const answer = { sessionId: session.sessionId, eventId: randomUUID(), questionId: practice.questions![0]!.id, answer: '10 m and 0 m' };
    const endpoint = `/learning/modules/${practice.id}/answers`;
    expect((await h!.post(endpoint, answer, cookie)).json().correct).toBe(true);
    expect((await h!.post(endpoint, answer, cookie)).json().correct).toBe(true);
    expect((await h!.post(endpoint, { ...answer, answer: 'different' }, cookie)).statusCode).toBe(409);
    expect((await h!.post(endpoint, { ...answer, eventId: randomUUID(), answer: "Haven't learned this yet" }, cookie)).json().word).toBe('New');
    expect((await h!.post(`/learning/sessions/${session.sessionId}/events`, { id: randomUUID(), type: 'answer_submitted', moduleId: module.id }, cookie)).statusCode).toBe(400);
    const summary = await h!.app.inject({ url: `/learning/sessions/${session.sessionId}/summary`, headers: { cookie } });
    expect(summary.json()).toMatchObject({ attempted: 2, correct: 1, notTaught: 1 });
    expect(summary.body).not.toContain('"band"');
    const other = h!.roleCookie(DEMO_SCHOOL_ID, 'student');
    expect((await h!.app.inject({ url: `/learning/sessions/${session.sessionId}`, headers: { cookie: other.cookie } })).statusCode).toBe(404);
    const modules = await h!.app.inject({ url: `/learning/modules?chapterId=${chapter.id}`, headers: { cookie } });
    expect(modules.statusCode).toBe(200);
    expect(modules.body).not.toMatch(/"(?:answer|acceptedAnswers)":/);
  });

  it('serves validated plans and tutors from persisted context rather than forged client history', async () => {
    const model = vi.fn<JsonModel>(async () => ({ invalid: true }));
    const { cookie, chapter, bank } = await setup(model);
    const planned = await h!.post('/learning/plan', { chapterId: chapter.id }, cookie);
    expect(planned.statusCode).toBe(200);
    const plan = LearningPlanSchema.parse(planned.json());
    expect(plan.status).toBe('fallback');
    expect(model).toHaveBeenCalledTimes(2);
    const session = (await h!.post('/learning/sessions', { chapterId: chapter.id, planId: plan.id }, cookie)).json();
    const me = (await h!.app.inject({ url: '/me', headers: { cookie } })).json();
    const module = bank.modules[0]!;
    const input = { context: { studentId: me.profile.id, subjectId: module.subjectId, chapterId: chapter.id,
      conceptId: module.conceptId, sessionId: session.sessionId, step: 900,
      recentAttempts: [{ questionId: 'forged', answer: 'forged', correct: true }] }, mode: 'test_me', moduleId: module.id,
      lastWrongAttempt: { questionId: 'forged', answer: 'forged' }, plan: { ...plan, currentStep: 900 } };
    const reply = await h!.post('/learning/tutor', input, cookie);
    expect(reply.statusCode).toBe(200);
    expect(TutorResponseSchema.parse(reply.json()).practiceQuestion).toBeDefined();
    expect(model.mock.calls.at(-1)![1]).toMatchObject({ context: { step: 0, recentAttempts: [] }, lastWrongAttempt: null, plan: { currentStep: 0 } });
    expect((await h!.post('/learning/tutor', { ...input, context: { ...input.context, studentId: 'someone-else' } }, cookie)).statusCode).toBe(404);
    expect((await h!.post('/learning/sessions', { chapterId: chapter.id, planId: 'unknown' }, cookie)).statusCode).toBe(404);
  });

  it('backs up file stores before additive schema changes and survives reopening', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'vs-proto-'));
    let database = openDatabase(join(directory, 'learning.db'));
    try {
      await prepareLearningStore(database);
      expect(readdirSync(join(directory, 'backups')).filter((name) => name.endsWith('.sqlite')).length).toBe(1);
      await prepareLearningSettings(database);
      database.sqlite.prepare('INSERT INTO proto_founder_settings VALUES (?,?,?,?)').run('school', 'test-persisted-key', '', 1);
      database.sqlite.prepare('INSERT INTO proto_study_session VALUES (?,?,?,?,?,?,?)').run('session', 'school', 'student', 'chapter', '{}', 1, 1);
      database.close();
      database = openDatabase(join(directory, 'learning.db'));
      await prepareLearningStore(database);
      await prepareLearningSettings(database);
      expect(database.sqlite.prepare('SELECT id FROM proto_study_session').get()).toEqual({ id: 'session' });
      expect(learningSettings(database, 'school')?.gemini_key).toBe('test-persisted-key');
      expect(readdirSync(join(directory, 'backups')).filter((name) => name.endsWith('.sqlite')).length).toBe(2);
    } finally { database.close(); rmSync(directory, { recursive: true, force: true }); }
  });

  it('has twelve distinct modes and validates model tutor output with grounded fallback', async () => {
    const { bank } = await setup();
    expect(new Set(Object.values(MODE_PROMPTS)).size).toBe(12);
    const module = bank.modules.find((module) => module.type === 'practice')!;
    const input = { context: { studentId: 'student', subjectId: module.subjectId, chapterId: module.chapterId, conceptId: module.conceptId, sessionId: 'session', step: 0, recentAttempts: [] },
      mode: 'hint' as const, question: 'Help', answer: null, lastWrongAttempt: null, plan: null, module };
    const fallback = TutorResponseSchema.parse(await tutorReply(input, offline));
    expect(fallback.explanation).toContain('Which');
    expect(fallback.explanation).not.toContain('10 m and 0 m');
    const result = await tutorReply(input, async () => ({ explanation: 'Check the path.', suggestedAction: 'Try again.', conceptId: 'invented', nextModuleId: 'invented', practiceQuestion: { id: 'made-up', prompt: 'made-up' } }));
    expect(result.conceptId).toBe(module.conceptId);
    expect(result.nextModuleId).toBeUndefined();
    expect(result.practiceQuestion).toBeUndefined();
    const related = bank.modules.filter((row) => row.id.startsWith(module.id.slice(0, module.id.lastIndexOf(':') + 1)));
    const teaching = await tutorReply({ ...input, mode: 'explain', relatedModules: related }, offline);
    expect(teaching.explanation).toContain('Displacement');
    const example = await tutorReply({ ...input, mode: 'real_life_example', relatedModules: related }, offline);
    expect(example.explanation).toContain('Walk 3 m');
    const fromConcept = await tutorReply({ ...input, mode: 'test_me', module: related[0]!, relatedModules: related }, offline);
    expect(fromConcept.practiceQuestion?.id).toBe(module.questions![0]!.id);
  });

  it('allows one-click roles only with the explicit non-production flag', async () => {
    await setup();
    for (const role of ['student', 'teacher', 'parent', 'admin']) {
      const result = await h!.post(`/auth/demo/${role}`, {});
      expect(result.statusCode).toBe(200);
      expect(result.json().profile.role).toBe(role);
    }
    vi.stubEnv('DEMO_LOOSE_AUTH', '');
    expect((await h!.post('/auth/demo/student', {})).statusCode).toBe(404);
    vi.stubEnv('DEMO_LOOSE_AUTH', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    expect((await h!.post('/auth/demo/student', {})).statusCode).toBe(404);
  });

  it('accepts arbitrary demo login and registration credentials without replacing existing data', async () => {
    await setup();
    const login = await h!.post('/auth/login', { email: 'anything', password: 'x' });
    expect(login.statusCode).toBe(200);
    const first = await h!.post('/auth/register-school', { email: 'demo-new@example.test', password: 'x' });
    expect(first.statusCode).toBe(201);
    const second = await h!.post('/auth/register-school', { email: 'demo-new@example.test', password: 'different' });
    expect(second.statusCode).toBe(200);
    expect(second.json().profile.id).toBe(first.json().profile.id);
    vi.stubEnv('DEMO_LOOSE_AUTH', '');
    expect((await h!.post('/auth/login', { email: 'anything', password: 'x' })).statusCode).toBe(400);
  });
});
