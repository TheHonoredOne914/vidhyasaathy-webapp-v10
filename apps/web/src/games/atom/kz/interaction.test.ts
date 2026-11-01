import { describe, expect, it } from 'vitest';
import { advanceZoom } from './interaction';

describe('hold-to-zoom interaction', () => {
  it('makes equal progress on fast and slow devices', () => {
    const fast = Array.from({ length: 20 }).reduce<number>((value) => advanceZoom(value, 0.05, true), 0);
    expect(fast).toBeCloseTo(advanceZoom(0, 1, true));
  });

  it('completes even when a timer is delayed', () => {
    expect(advanceZoom(0, 2, true)).toBe(1);
  });

  it('backs out after release without overshooting', () => {
    expect(advanceZoom(0.5, 1, false)).toBeCloseTo(0.34);
    expect(advanceZoom(0.5, 10, false)).toBe(0);
  });

  it('ignores negative elapsed time', () => {
    expect(advanceZoom(0.5, -1, true)).toBe(0.5);
  });
});
