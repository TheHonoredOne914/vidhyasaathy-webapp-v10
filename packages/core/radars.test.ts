import { expect, it } from 'vitest';
import { MASTERY_HALF_LIFE_MS } from './mastery.ts';
import {
  ABANDON_WINDOW_MS, FAST_WRONG_MS, frustrationRadar, RESUBMIT_WINDOW_MS, revisionRadar, type RadarState,
} from './radars.ts';

const now = Date.UTC(2026, 9, 24, 12);

function state(partial: Partial<RadarState> & Pick<RadarState, 'conceptId'>): RadarState {
  return { name: partial.conceptId, level: 2, mastery: 0.8, updatedAt: now, nextReview: now + 86_400_000, ...partial };
}

it('lists fading concepts by decay and leaves a clear radar alone', () => {
  const fresh = state({ conceptId: 'acceleration', level: 3, mastery: 0.9 });
  const due = state({ conceptId: 'distance', nextReview: now - 1, mastery: 0.7 });
  const faded = state({ conceptId: 'speed', level: 3, mastery: 0.8, updatedAt: now - MASTERY_HALF_LIFE_MS * 2 });
  const freshOnly = revisionRadar([fresh, state({ conceptId: 'new', level: null, mastery: 0 })], now);
  expect(freshOnly).toEqual([]);
  const fading = revisionRadar([fresh, due, faded], now);
  expect(fading.map((row) => row.conceptId)[0]).toBe('speed');
  expect(fading.map((row) => row.conceptId)).toContain('distance');
  expect(fading.map((row) => row.conceptId)).not.toContain('acceleration');
});

it('flags fast wrong answers, rapid resubmits, and a repeated abandon without alarm copy', () => {
  const fast = (correct: boolean, timeMs: number) => ({ correct, timeMs, at: now });
  expect(frustrationRadar([fast(false, 1000), fast(false, 1000)], [])).toBeNull();
  expect(frustrationRadar([fast(false, FAST_WRONG_MS), fast(false, 1000), fast(false, 1000)], [])).toBeNull();
  const flagged = frustrationRadar([fast(false, FAST_WRONG_MS - 1), fast(false, 1000), fast(false, 1000)], []);
  expect(flagged).toMatchObject({ nextSetSize: 3, ladderDelta: -1, learningEvent: { kind: 'frustration_flagged' }, breakCard: 'Take a 2-minute break?' });
  expect(JSON.stringify(flagged)).not.toMatch(/red/i);
  expect(frustrationRadar([], [
    { kind: 'resubmit', stepId: 'a', at: now },
    { kind: 'resubmit', stepId: 'a', at: now + RESUBMIT_WINDOW_MS },
  ])).not.toBeNull();
  expect(frustrationRadar([], [
    { kind: 'resubmit', stepId: 'a', at: now },
    { kind: 'resubmit', stepId: 'a', at: now + RESUBMIT_WINDOW_MS + 1 },
  ])).toBeNull();
  expect(frustrationRadar([], [
    { kind: 'abandon', stepId: 'step', at: now },
    { kind: 'abandon', stepId: 'other', at: now + 1000 },
  ])).toBeNull();
  expect(frustrationRadar([], [
    { kind: 'abandon', stepId: 'step', at: now },
    { kind: 'abandon', stepId: 'step', at: now + ABANDON_WINDOW_MS },
  ])).not.toBeNull();
});
