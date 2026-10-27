import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AskSchema, ReviewDraftJobSchema, SubmitRemediationSchema } from './ai.ts';

describe('AI contracts', () => {
  it('defaults to the first hint and rejects scope overrides and oversized questions', () => {
    const input = { chapterId: randomUUID(), question: 'What is acceleration?' };
    expect(AskSchema.parse(input)).toMatchObject({ hintLevel: 1, socratic: false });
    for (const extra of [{ hintLevel: 0 }, { hintLevel: 4 }, { profileId: randomUUID() }, { question: 'x'.repeat(1001) }]) {
      expect(AskSchema.safeParse({ ...input, ...extra }).success).toBe(false);
    }
  });

  it('requires reviewed content and a teacher deadline to approve', () => {
    expect(ReviewDraftJobSchema.safeParse({ decision: 'approve' }).success).toBe(false);
    expect(ReviewDraftJobSchema.parse({ decision: 'reject' })).toEqual({ decision: 'reject' });
  });

  it('requires exactly two distinct check answers and an idempotency key', () => {
    const answer = { itemId: randomUUID(), answer: 'one' };
    expect(SubmitRemediationSchema.safeParse({ clientEventId: randomUUID(), answers: [answer, answer] }).success).toBe(false);
    expect(SubmitRemediationSchema.safeParse({ answers: [answer, { ...answer, itemId: randomUUID() }] }).success).toBe(false);
    expect(SubmitRemediationSchema.safeParse({ clientEventId: randomUUID(), answers: [answer, { ...answer, itemId: randomUUID() }] }).success).toBe(true);
  });
});
