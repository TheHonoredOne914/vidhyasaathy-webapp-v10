import { describe, expect, it } from 'vitest';
import { activeTransportValidator, conceptCheckValidator, diffusionDirectionValidator, membraneValidator, organelleValidator, osmosisValidator } from './index';

describe('Bio Quest Gatekeeper validators', () => {
  it('matches molecules to transport gates', () => {
    expect(membraneValidator({ oxygen: 'simple', carbonDioxide: 'simple', water: 'aquaporin', glucose: 'carrier', sodium: 'pump', potassium: 'pump' }).correct).toBe(true);
    expect(membraneValidator({ oxygen: 'pump', carbonDioxide: 'simple', water: 'aquaporin', glucose: 'carrier', sodium: 'pump', potassium: 'pump' }).correct).toBe(false);
  });
  it('accepts isotonic salt and rejects extremes', () => { expect(osmosisValidator(50).correct).toBe(true); expect(osmosisValidator(90).correct).toBe(false); });
  it('checks organelles and concept questions', () => {
    const answer = { nucleus: 'control', mitochondria: 'energy', er: 'manufacture', golgi: 'package', vacuole: 'storage' };
    expect(organelleValidator(answer).correct).toBe(true);
    expect(diffusionDirectionValidator('high-low').correct).toBe(true);
    expect(activeTransportValidator('pump').correct).toBe(true);
    expect(conceptCheckValidator('selective').correct).toBe(true);
  });
});
