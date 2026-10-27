import { describe, expect, it } from 'vitest';
import { matterGame, validateDiffusion, validateEvaporation, validateHeatingCurve, validateState } from './index';
import { validateGame } from '../engine/types';

describe('Matter in Motion game', () => {
  it('keeps the engine contract and four levels', () => { expect(() => validateGame(matterGame)).not.toThrow(); expect(matterGame.arena?.levels).toHaveLength(4); });
  it('checks the states level', () => { expect(validateState({ phase: 'liquid', temperature: 50 }).correct).toBe(true); expect(validateState({ phase: 'gas', temperature: 50 }).correct).toBe(false); });
  it('checks the diffusion race', () => { expect(validateDiffusion('hot').correct).toBe(true); expect(validateDiffusion('cold').correct).toBe(false); });
  it('checks the heating curve plateau', () => { expect(validateHeatingCurve(0).correct).toBe(true); expect(validateHeatingCurve(100).correct).toBe(false); });
  it('checks all evaporation factors', () => { expect(validateEvaporation({ heat: true, surface: true, wind: true }).correct).toBe(true); expect(validateEvaporation({ heat: true, surface: false, wind: true }).correct).toBe(false); });
});
