import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PracticeAttemptSchema, PracticeQuerySchema, SubmitPracticeAttemptSchema } from './practice.ts';

describe('practice contracts', () => {
  it('bounds sets and rejects invented games and extra fields', () => {
    expect(PracticeQuerySchema.parse({})).toEqual({ gameId: 'quick_revision_quiz', limit: 6 });
    for (const input of [{ limit: 31 }, { gameId: 'leaderboard' }, { profileId: randomUUID() }]) {
      expect(PracticeQuerySchema.safeParse(input).success).toBe(false);
    }
  });
  it('accepts only answer events, never client-supplied grades or identity', () => {
    const event = { clientEventId: randomUUID(), itemId: randomUUID(), answer: 'A', timeMs: 0, clientTs: 0 };
    expect(SubmitPracticeAttemptSchema.parse(event)).toEqual(event);
    for (const extra of [{ correct: true }, { profileId: randomUUID() }, { assignmentId: randomUUID() }]) {
      expect(SubmitPracticeAttemptSchema.safeParse({ ...event, ...extra }).success).toBe(false);
    }
    expect(PracticeAttemptSchema.shape.assignmentId.safeParse(randomUUID()).success).toBe(false);
  });
});
