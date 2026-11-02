import { randomUUID } from 'node:crypto';
import { AskTeachingModeSchema, TodayPlanSchema } from '@vidhyasaathy/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { askTeachingInstruction } from '../src/ai/ask-learning.ts';
import { LocalStubProvider } from '../src/ai/provider.ts';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { chapters } from '../src/db/schema.ts';
import { statusWordFor } from '../src/learning/status-word.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';

let h: Harness | undefined;
afterEach(async () => { await h?.app.close(); h = undefined; vi.unstubAllEnvs(); });
async function setup() {
  const provider = new LocalStubProvider();
  const stream = vi.spyOn(provider, 'stream');
  h = await createHarness({ llmProvider: provider, learningModel: async () => { throw new Error('offline'); } });
  await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  vi.stubEnv('DEMO_LOOSE_AUTH', 'true');
  const cookie = cookieFrom((await h.post('/auth/demo/student', {})).headers);
  const chapter = h.database.db.select().from(chapters).all().find((row) => row.title === 'Motion')!;
  return { cookie, chapter, stream };
}

describe('student flow', () => {
  it('uses friendly words at every boundary and never penalises unseen ideas', () => {
    expect(statusWordFor(0, 0)).toBe('New');
    expect([0.39, 0.4, 0.69, 0.7, 0.89, 0.9].map((mastery) => statusWordFor(mastery, 1))).toEqual(["Let's fix this", 'Almost there', 'Almost there', 'Mastered', 'Mastered', 'Top form']);
  });
  it('gives every supported teaching mode its own structured instruction', () => {
    const modes = ['explain', 'teach_from_zero', 'simpler', 'differently', 'real_life_example', 'visual', 'hint', 'test_me', 'find_my_mistake', 'practise', 'revise', 'plan_my_learning', 'example', 'quiz_me', 'step_by_step', 'real_life'];
    expect(new Set(modes.map((mode) => askTeachingInstruction(AskTeachingModeSchema.parse(mode)))).size).toBe(modes.length);
  });
  it('always supplies a usable today action and prioritises an owned active session', async () => {
    const { cookie, chapter } = await setup();
    const today = () => h!.app.inject({ url: '/student/today', headers: { cookie } });
    const first = await today();
    expect(first.statusCode).toBe(200);
    TodayPlanSchema.parse(first.json());
    expect(first.body).not.toMatch(/resumeState|step=|"band"|"rank"/);
    const session = (await h!.post('/learning/sessions', { chapterId: chapter.id }, cookie)).json();
    const next = (await today()).json();
    expect(next.primary).toMatchObject({ kind: 'continue_session', sessionId: session.id, href: `/student/learning/sessions/${session.id}` });
    expect(next.next.length).toBeLessThanOrEqual(3);
    const other = h!.roleCookie(DEMO_SCHOOL_ID, 'student').cookie;
    expect((await h!.app.inject({ url: '/student/today', headers: { cookie: other } })).body).not.toContain(session.id);
  });
  it('adds the owned current step to ask context and rejects another student’s session', async () => {
    const { cookie, chapter, stream } = await setup();
    const session = (await h!.post('/learning/sessions', { chapterId: chapter.id }, cookie)).json();
    const response = await h!.post('/ask/stream', { clientEventId: randomUUID(), text: 'Explain displacement', chapterId: chapter.id, sessionId: session.id, teachingMode: 'simpler', style: 'explain' }, cookie);
    expect(response.statusCode).toBe(200);
    expect(stream).toHaveBeenCalled();
    expect(stream.mock.calls.at(-1)![0].system).toContain('stepTitle');
    expect(stream.mock.calls.at(-1)![0].system).toContain(askTeachingInstruction('simpler'));
    const other = h!.roleCookie(DEMO_SCHOOL_ID, 'student').cookie;
    expect((await h!.post('/ask/stream', { clientEventId: randomUUID(), text: 'Explain displacement', sessionId: session.id }, other)).statusCode).toBe(404);
  });
});
