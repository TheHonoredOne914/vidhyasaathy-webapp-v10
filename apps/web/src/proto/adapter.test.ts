import { afterEach, describe, expect, it, vi } from 'vitest';
import { learningApi, rememberSession, resumeEntries, safeGameRoute, SessionSchema } from './adapter';
import { restoredPractice } from './progress';
import type { LearningEvent, LearningModule } from '@vidhyasaathy/contracts';

const module: LearningModule = { id: 'chapter:topic:0:practice', chapterId: 'chapter', subjectId: 'physics', conceptId: 'distance', type: 'practice', objective: 'Compare distance and displacement', content: 'Try one question.', questions: [{ id: 'q1', prompt: 'First question' }, { id: 'q2', prompt: 'Second question' }] };
const plan = { id: 'plan', chapterId: 'chapter', subjectId: 'physics', objectives: ['Compare distance and displacement'], steps: [{ moduleId: module.id }], currentStep: 0, status: 'active' };
const session = { id: 'session', sessionId: 'session', chapterId: 'chapter', plan, events: [] };
const result = { correct: false, notTaught: false, word: "Let's fix this", feedback: 'Compare start and finish.', repairModuleId: 'repair' };
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } }); }
function event(questionId: string, correct: boolean, notTaught = false): LearningEvent {
  return { id: crypto.randomUUID(), sessionId: 'session', conceptId: 'distance', type: 'answer_submitted', ts: new Date().toISOString(), result: { ...result, questionId, moduleId: module.id, correct, notTaught } };
}
afterEach(() => { vi.unstubAllGlobals(); });

describe('learning API boundary', () => {
  it('submits answers to the server and preserves the event ID when retrying', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response(result));
    vi.stubGlobal('fetch', fetch);
    await expect(learningApi.answer('session', module.id, 'q1', 'my attempt', 'attempt-id')).rejects.toThrow();
    await expect(learningApi.answer('session', module.id, 'q1', 'my attempt', 'attempt-id')).resolves.toEqual(result);
    const [url, init] = fetch.mock.calls[1];
    expect(url).toBe(`/api/learning/modules/${encodeURIComponent(module.id)}/answers`);
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({ sessionId: 'session', questionId: 'q1', answer: 'my attempt', eventId: 'attempt-id' });
  });
  it('does not invent a score when the endpoint is unavailable or malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(response({ feedback: 'No score' })));
    await expect(learningApi.answer('session', module.id, 'q1', 'x', 'id')).rejects.toMatchObject({ status: 404 });
    await expect(learningApi.answer('session', module.id, 'q1', 'x', 'id')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('restores the server plan and records module completion with its own action ID', async () => {
    const fetch = vi.fn().mockResolvedValue(response(session));
    vi.stubGlobal('fetch', fetch);
    expect((await learningApi.session('session')).plan.currentStep).toBe(0);
    await learningApi.event('session', module.id, 'module_completed', 'completion-id');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ id: 'completion-id', type: 'module_completed', moduleId: module.id });
  });
});

describe('resuming practice', () => {
  it('resumes at the first unanswered question, preserving a correct final answer', () => {
    expect(restoredPractice(module, [event('q1', true)]).index).toBe(1);
    const restored = restoredPractice(module, [event('q1', true), event('q2', true)]);
    expect(restored.index).toBe(1);
    expect(restored.result?.correct).toBe(true);
  });
  it('uses the latest attempt and keeps not-taught separate from correctness', () => {
    const restored = restoredPractice(module, [event('q1', false), event('q1', true), event('q2', false, true)]);
    expect(restored.index).toBe(1);
    expect(restored.result).toMatchObject({ correct: false, notTaught: true });
  });
  it('does not use another module or session activity as question evidence', () => {
    const other = event('q1', true); other.result!.moduleId = 'another-module';
    expect(restoredPractice(module, [other]).result).toBeNull();
  });
});

describe('resume pointers', () => {
  it('stores owner-scoped shortcuts without answers or chat', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    rememberSession('aarav', SessionSchema.parse(session), 'Motion');
    expect(resumeEntries('meera')).toEqual([]);
    expect(resumeEntries('aarav')[0]).toMatchObject({ id: 'session', title: 'Motion', completed: false });
    expect(Object.keys(resumeEntries('aarav')[0]).sort()).toEqual(['chapterId', 'completed', 'id', 'title', 'updatedAt']);
    values.set('learning-resume:aarav', '{broken');
    expect(resumeEntries('aarav')).toEqual([]);
  });
  it('allows only student game routes that preserve the protected Atom surface', () => {
    expect(safeGameRoute('/student/chapters/motion/practice/engine/motion')).toBe(true);
    for (const route of ['https://example.com', '//example.com', '/student/\\evil', '/student/games/atom']) expect(safeGameRoute(route)).toBe(false);
  });
});
