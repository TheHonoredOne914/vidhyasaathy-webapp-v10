import { afterEach, expect, it, vi } from 'vitest';
import { finishSession, SessionSchema, startSession, submitAnswer } from './gameApi';

afterEach(() => vi.unstubAllGlobals());
it('strips internal difficulty and any accidental keys before rendering', () => {
  expect(SessionSchema.parse({ sessionId: 's', checkpoints: { first: { itemId: 'q', stem: 'Question', options: [], format: 'mcq', level: 'L1', answer: { optionId: 'a' } } } }).checkpoints.first).toEqual({ itemId: 'q', stem: 'Question', options: [], format: 'mcq' });
});
it('addresses the session, not the checkpoint or event ID', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ sessionId: 'session', checkpoints: {} })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ correct: true, explanation: 'Notes', xp: 2 })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ answered: 1, correct: 1, personalBest: true, best: { kind: 'score', value: 1, label: 'Best 1/1' }, xp: 2 })));
  vi.stubGlobal('fetch', fetch);
  await startSession('motion', 'start-event');
  await submitAnswer('motion', 'session', { clientEventId: 'answer-event', checkpointKey: 'scene-1', answer: { optionId: 'a' }, confidence: 'sure', timeMs: 4000 });
  const result = await finishSession('motion', 'session');
  expect(fetch.mock.calls.map((call) => call[0])).toEqual(['/api/games/motion/sessions', '/api/games/motion/sessions/session/answer', '/api/games/motion/sessions/session/finish']);
  expect(result.answered).toBe(1);
});
