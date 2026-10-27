import { randomUUID } from 'node:crypto';
import { SubmitPracticeAttemptSchema, type PublicItem, type SubmitPracticeAttempt } from '@vidhyasaathy/contracts';
import { expect, it } from 'vitest';
import { gameModules } from './games.ts';

function item(type: 'mcq' | 'match_pairs' = 'mcq'): PublicItem {
  const base = { conceptId: randomUUID(), prompt: 'Pick one', difficulty: 1, sourceRef: null };
  return { id: randomUUID(), position: 0, ...base, ...(type === 'mcq'
    ? { type, options: ['a', 'b'] } : { type, left: ['a', 'b'], right: ['1', '2'] }) };
}
const event = (itemId: string, timeMs = 50): SubmitPracticeAttempt => ({ clientEventId: randomUUID(), itemId, answer: 'a', timeMs, clientTs: 100 });

it('all five formats consume public schema items and emit the standard attempt event', () => {
  expect(Object.keys(gameModules)).toHaveLength(5);
  for (const game of Object.values(gameModules)) {
    const question = item(game.id === 'match_the_concept' ? 'match_pairs' : 'mcq');
    const state = game.start([question], { startedAt: 100 });
    const input = event(question.id);
    if (question.type === 'match_pairs') input.answer = ['1', '2'];
    const answered = game.onAnswer(state, input, true);
    const result = game.result(answered);
    expect(result).toMatchObject({ total: 1, answered: 1, correct: 1, pendingReview: 0, completed: true });
    expect(SubmitPracticeAttemptSchema.parse(result.attempts[0]!.event)).toEqual(input);
    expect(result.attempts[0]!.conceptId).toBe(question.conceptId);
    expect(state.answers).toEqual([]);
    expect(game.onAnswer(answered, input, true, 999999)).toBe(answered);
    expect(() => game.onAnswer(answered, { ...input, answer: 'b' }, true)).toThrow('Conflicting game event.');
  }
});

it('rejects unsupported/duplicate items and out-of-order answers', () => {
  expect(() => gameModules.mcq_rush.start([item('match_pairs')], { startedAt: 100 })).toThrow('Unsupported game item.');
  const question = item();
  expect(() => gameModules.quick_revision_quiz.start([question, question], { startedAt: 100 })).toThrow('Duplicate game item.');
  const state = gameModules.quick_revision_quiz.start([question, item()], { startedAt: 100 });
  expect(() => gameModules.quick_revision_quiz.onAnswer(state, event(state.items[1]!.id), true)).toThrow('Answer the current game item.');
  expect(() => gameModules.mcq_rush.result(state)).toThrow('Wrong game state.');
});

it('timers end rounds without rewarding speed; correct marking alone counts', () => {
  const game = gameModules.timed_concept_challenge, question = item();
  const state = game.start([question, item()], { startedAt: 100, durationMs: 1000 });
  expect(() => game.onAnswer(state, event(question.id), true, 1100)).toThrow('Game clock expired or invalid.');
  expect(game.result(state, 1100).completed).toBe(true);
  const fast = game.result(game.onAnswer(state, event(question.id, 1), true));
  const slow = game.result(game.onAnswer(state, event(question.id, 900), true));
  expect(fast.correct).toBe(slow.correct);
  expect(game.result(game.onAnswer(state, event(question.id), null))).toMatchObject({ correct: 0, pendingReview: 1 });
  expect(() => game.start([], { startedAt: -1 })).toThrow(RangeError);
});
