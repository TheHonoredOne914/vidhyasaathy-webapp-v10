import { describe, expect, it } from 'vitest';
import { cubicInOut } from './CameraRig';

describe('cutscene camera easing', () => {
  it('holds endpoints and has a symmetric midpoint', () => {
    expect(cubicInOut(0)).toBe(0);
    expect(cubicInOut(0.5)).toBe(0.5);
    expect(cubicInOut(1)).toBe(1);
    for (let i = 0; i <= 50; i++) expect(cubicInOut(i / 50)).toBeCloseTo(1 - cubicInOut(1 - i / 50));
  });
});
