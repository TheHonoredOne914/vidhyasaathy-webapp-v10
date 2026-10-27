import { describe, expect, it } from 'vitest';
import { validateGame } from '../engine/types';
import { newtonGame } from './index';
import { validateFma, validateInertia, validateMomentum, validateReaction } from './validators';
describe('Force Arena', () => {
  it('passes arena validation', () => expect(() => validateGame(newtonGame)).not.toThrow());
  it('checks inertia', () => { expect(validateInertia(7).correct).toBe(true); expect(validateInertia(4).correct).toBe(false); });
  it('checks F = ma', () => { expect(validateFma({ force: 12, mass: 3, acceleration: 4 }).correct).toBe(true); expect(validateFma({ force: 8, mass: 3, acceleration: 2.7 }).correct).toBe(false); });
  it('checks action-reaction', () => { expect(validateReaction('balloon-air').correct).toBe(true); expect(validateReaction('balloon-wall').correct).toBe(false); });
  it('checks momentum conservation', () => { expect(validateMomentum({ before: 8, after: 8 }).correct).toBe(true); expect(validateMomentum({ before: 8, after: 6 }).correct).toBe(false); });
});
