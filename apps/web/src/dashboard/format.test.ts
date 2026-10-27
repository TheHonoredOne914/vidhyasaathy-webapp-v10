import { describe, expect, it } from 'vitest';
import { clockFromMinutes, evidenceLabel, heatClass, minutesFromClock } from './format';

describe('dashboard labels', () => {
  it('withholds a rate until the minimum marked checks exist', () => {
    expect(evidenceLabel({ attempts: 2, correct: 1, pendingReview: 0, passRate: null, confidence: 'insufficient', minAttempts: 3 }))
      .toBe('2 marked. A rate needs 3 marked checks.');
    expect(evidenceLabel({ attempts: 4, correct: 3, pendingReview: 1, passRate: 0.75, confidence: 'available', minAttempts: 3 }))
      .toBe('3 of 4 correct, 75 percent. Enough marked checks to show a rate. 1 waiting for review.');
  });

  it('maps quiet-hour clocks and practice counts', () => {
    expect(clockFromMinutes(1320)).toBe('22:00');
    expect(clockFromMinutes(420)).toBe('07:00');
    expect(minutesFromClock('22:00')).toBe(1320);
    expect(minutesFromClock('24:00')).toBeNull();
    expect(heatClass(0)).toBe('heat-none');
    expect(heatClass(2)).toBe('heat-some');
    expect(heatClass(3)).toBe('heat-many');
  });
});
