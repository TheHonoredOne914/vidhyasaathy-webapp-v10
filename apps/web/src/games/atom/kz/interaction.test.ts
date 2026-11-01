import { describe, expect, it } from 'vitest';
import { advanceZoom, nucleusRecoil, rejectedElectronProgress } from './interaction';
import { isotopeStability } from '../validators';

describe('particle reactions', () => {
  it('recoils then settles at the original scale', () => {
    expect(nucleusRecoil(0, false)).toBe(0);
    expect(nucleusRecoil(0.08, false)).toBeGreaterThan(0);
    expect(Math.abs(nucleusRecoil(2, false))).toBeLessThan(0.0001);
    expect(nucleusRecoil(0.08, true)).toBe(0);
  });
  it('approaches a full shell, bounces away, then disappears', () => {
    expect(rejectedElectronProgress(0).approach).toBe(0);
    expect(rejectedElectronProgress(0.425).approach).toBe(1);
    expect(rejectedElectronProgress(0.65).approach).toBeLessThan(1);
    expect(rejectedElectronProgress(2)).toEqual({ approach: expect.closeTo(0), scale: 0 });
  });
  it('does not punish stable carbon-13 as an unstable nucleus', () => {
    expect(isotopeStability(6, 6)).toBe('stable');
    expect(isotopeStability(6, 7)).toBe('stable');
    expect(isotopeStability(6, 8)).toBe('radioactive');
  });
});

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
