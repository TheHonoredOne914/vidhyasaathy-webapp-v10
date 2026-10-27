import { describe, expect, it } from 'vitest';
import { validateConservation, validateKineticEnergy, validatePotentialEnergy, validateWork } from './validators';

describe('Energy Works validators', () => {
  it('checks work', () => { expect(validateWork('push').correct).toBe(true); expect(validateWork('hold').correct).toBe(false); });
  it('checks kinetic energy', () => { expect(validateKineticEnergy(180).correct).toBe(true); expect(validateKineticEnergy(120).correct).toBe(false); });
  it('checks potential energy', () => { expect(validatePotentialEnergy(240).correct).toBe(true); expect(validatePotentialEnergy(120).correct).toBe(false); });
  it('checks conservation', () => { expect(validateConservation({ top: 'potential', bottom: 'kinetic' }).correct).toBe(true); expect(validateConservation({ top: 'kinetic', bottom: 'potential' }).correct).toBe(false); });
});
