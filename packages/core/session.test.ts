import { describe, expect, it } from 'vitest';
import { advanceSlide, completeSession, sessionProgress } from './session.ts';

describe('session progression', () => {
  it('unlocks the next slide in sequence and allows idempotent replay', () => {
    expect(advanceSlide(3, 0, 0)).toBe(1);
    expect(advanceSlide(3, 1, 1)).toBe(2);
    expect(advanceSlide(3, 2, 0)).toBe(2);
    expect(advanceSlide(3, 2, 2)).toBe(3);
    expect(advanceSlide(3, 3, 2)).toBe(3);
    expect(() => advanceSlide(3, 0, 1)).toThrow(RangeError);
    expect(() => advanceSlide(3, 1, 2)).toThrow(RangeError);
  });
  it('opens the check only after the final slide and requires its submission for completion', () => {
    expect(sessionProgress(2)).toEqual({ viewedSlides: 0, totalSlides: 2, checkAvailable: false, completed: false });
    expect(sessionProgress(2, 1).checkAvailable).toBe(false);
    expect(sessionProgress(2, 2)).toMatchObject({ checkAvailable: true, completed: false });
    expect(() => completeSession(2, 1, true)).toThrow(RangeError);
    expect(() => completeSession(2, 2, false)).toThrow(RangeError);
    expect(completeSession(2, 2, true)).toMatchObject({ checkAvailable: true, completed: true });
    expect(sessionProgress(1, advanceSlide(1, 0, 0)).completed).toBe(false);
  });
  it.each([[0, 0], [-1, 0], [1.5, 0], [2, -1], [2, 3], [2, 0.5], [NaN, 0], [Infinity, 0]])(
    'rejects invalid slide state (%s, %s)', (total, viewed) => {
      expect(() => sessionProgress(total, viewed)).toThrow(RangeError);
      expect(() => advanceSlide(total, viewed, 0)).toThrow(RangeError);
    },
  );
  it.each([-1, 3, 0.5, NaN, Infinity])('rejects an invalid slide position %s', (position) => {
    expect(() => advanceSlide(3, 0, position)).toThrow(RangeError);
  });
});
