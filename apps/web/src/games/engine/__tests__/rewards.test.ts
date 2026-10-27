import { describe, expect, it } from 'vitest';
import { awardCheckpoint, awardFocus, checkpointStars, initialRewards } from '../rewards';

describe('interactive video rewards', () => {
  it('awards three, two, and one stars by attempt quality', () => {
    expect(checkpointStars({ sceneId: 'a', sceneIndex: 0, attempts: 1, hintUsed: false, reteachUsed: false })).toBe(3);
    expect(checkpointStars({ sceneId: 'b', sceneIndex: 1, attempts: 1, hintUsed: true, reteachUsed: false })).toBe(2);
    expect(checkpointStars({ sceneId: 'c', sceneIndex: 3, attempts: 2, hintUsed: false, reteachUsed: true })).toBe(1);
  });

  it('removes the streak after a non-first try and skips every third scene', () => {
    const first = awardCheckpoint(initialRewards(), { sceneId: 'a', sceneIndex: 0, attempts: 1, hintUsed: false, reteachUsed: false });
    const second = awardCheckpoint(first, { sceneId: 'b', sceneIndex: 2, attempts: 2, hintUsed: false, reteachUsed: false });
    expect(second).toMatchObject({ stars: 3, streak: 0 });
    expect(awardFocus(second, 'b', 2)).toBe(second);
  });
});
