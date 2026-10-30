import { expect, it } from 'vitest';
import { xpFromEvidence } from './xp.ts';

it('derives points from evidence without a level', () => {
  expect(xpFromEvidence([
    { kind: 'answer', correct: true, confidence: 'sure' },
    { kind: 'answer', correct: true, confidence: 'guess' },
    { kind: 'answer', correct: false, confidence: 'sure' },
    { kind: 'session_completed' },
    { kind: 'daily_challenge_completed' },
  ])).toBe(10 + 3 + 20 + 15);
});
