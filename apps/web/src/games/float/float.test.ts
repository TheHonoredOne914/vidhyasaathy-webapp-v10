import { describe, expect, it } from 'vitest';
import { game } from './index';
import { archimedesValidator, massWeightValidator, pressureValidator, freeFallValidator } from './validators';

describe('Float Harbor arena', () => {
  it('defines four gravitation levels', () => { expect(game.arena?.name).toBe('FLOAT HARBOR'); expect(game.arena?.levels).toHaveLength(4); });
  it('checks free fall', () => { expect(freeFallValidator(0).correct).toBe(true); expect(freeFallValidator(9.8).correct).toBe(false); });
  it('checks Moon mass and weight', () => { expect(massWeightValidator(60, 96.6, 'Moon').correct).toBe(true); expect(massWeightValidator(60, 588, 'Earth').correct).toBe(false); });
  it('checks thrust and contact area', () => { expect(pressureValidator(25, 100).correct).toBe(true); expect(pressureValidator(100, 100).correct).toBe(false); });
  it('checks Archimedes readings', () => { expect(archimedesValidator(8, 5).correct).toBe(true); expect(archimedesValidator(8, 6).correct).toBe(false); });
});
