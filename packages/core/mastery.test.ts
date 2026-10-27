import { describe, expect, it } from 'vitest';
import { calculateMastery, MASTERY_HALF_LIFE_MS } from './mastery.ts';

describe('recency-weighted mastery and Leitner scheduling', () => {
  const event = (id: string, correct: boolean, timestamp = 0) => ({ clientEventId: id, correct, timestamp });
  it('weights recent evidence more heavily without using time spent', () => {
    const state = calculateMastery([event('old', false), event('new', true, MASTERY_HALF_LIFE_MS)]);
    expect(state.mastery).toBeCloseTo(2 / 3);
    expect(state.attempts).toBe(2);
    expect(state.leitnerBox).toBe(2);
    expect(state.nextReview).toBe(MASTERY_HALF_LIFE_MS + 3 * 86400000);
  });
  it('handles out-of-order delivery, duplicates, ties and corrections deterministically', () => {
    const evidence = [event('a', true, 1), event('b', false, 2), event('c', true, 2)];
    expect(calculateMastery([...evidence].reverse())).toEqual(calculateMastery(evidence));
    expect(calculateMastery([...evidence, evidence[0]!])).toEqual(calculateMastery(evidence));
    expect(() => calculateMastery([event('a', true), event('a', false)])).toThrow(RangeError);
  });
  it('caps correct streaks and resets a missed concept to the first box', () => {
    const evidence = Array.from({ length: 20 }, (_, i) => event(String(i), true, i));
    expect(calculateMastery(evidence).leitnerBox).toBe(5);
    expect(calculateMastery([...evidence, event('miss', false, 21)]).leitnerBox).toBe(1);
    expect(calculateMastery([])).toMatchObject({ mastery: 0, attempts: 0, leitnerBox: 1 });
    expect(() => calculateMastery([event('bad', true, -1)])).toThrow(RangeError);
    expect(calculateMastery([event('end', true, Number.MAX_SAFE_INTEGER)]).nextReview).toBe(Number.MAX_SAFE_INTEGER);
  });
});
