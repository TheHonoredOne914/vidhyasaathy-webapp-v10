import { describe, expect, it } from 'vitest';
import { validateDegree, validateFactor, validateValue, validateZeros } from './validators';
describe('Poly Peaks validators', () => {
  it('checks degree and terms', () => { expect(validateDegree({ x2: '1', x1: '3', constant: '1', degree: '2', type: 'quadratic' }).correct).toBe(true); expect(validateDegree({ x2: '0', x1: '3', constant: '1', degree: '1', type: 'linear' }).correct).toBe(false); });
  it('checks p(a)', () => { expect(validateValue(0).correct).toBe(true); expect(validateValue(2).correct).toBe(false); });
  it('checks both zeroes', () => { expect(validateZeros({ first: '2', second: '3' }).correct).toBe(true); expect(validateZeros({ first: '2', second: '4' }).correct).toBe(false); });
  it('checks the remainder theorem', () => { expect(validateFactor({ a: '1', remainder: '6', factor: 'not-factor' }).correct).toBe(true); expect(validateFactor({ a: '1', remainder: '0', factor: 'factor' }).correct).toBe(false); });
});
