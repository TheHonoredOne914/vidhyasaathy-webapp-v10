import { describe, expect, it } from 'vitest';
import { validateGame } from '../engine/types';
import { atomGame } from './index';
import { alphaModel, atomBuild, conceptQuiz, isotopeSort, isotopeName, isotopeStability, massNumber } from './validators';

describe('Structure of the Atom game', () => {
  // AGENTS.md: Atom Forge is paused, so the definition has no scenes until that game resumes.
  it.skip('passes the engine structure validator (Atom Forge is paused)', () => {
    expect(() => validateGame(atomGame)).not.toThrow();
  });

  it('identifies Rutherford from the alpha-particle evidence', () => {
    expect(alphaModel('rutherford').correct).toBe(true);
    expect(alphaModel('thomson').correct).toBe(false);
  });

  it('enforces sodium shell placement and nucleus contents', () => {
    const placement: Record<string, string> = {};
    for (let index = 1; index <= 23; index += 1) placement[`p${index}`] = 'nucleus';
    for (let index = 1; index <= 2; index += 1) placement[`k${index}`] = 'k';
    for (let index = 1; index <= 8; index += 1) placement[`l${index}`] = 'l';
    placement.m1 = 'm';
    expect(atomBuild(placement).correct).toBe(true);
    expect(atomBuild({ ...placement, m1: 'l' }).correct).toBe(false);
  });

  it('sorts isotopes and isobars', () => {
    expect(isotopeSort({ ca40: 'isobar', ar40: 'isobar', c12: 'isotope', c14: 'isotope' }).correct).toBe(true);
    expect(isotopeSort({ ca40: 'isotope', ar40: 'isobar', c12: 'isotope', c14: 'isotope' }).correct).toBe(false);
  });

  it('checks all three concept questions', () => {
    expect(conceptQuiz({ q1: 'protons', q2: 'fourteen', q3: 'isotopes' }).correct).toBe(true);
    expect(conceptQuiz({ q1: 'neutrons', q2: 'fourteen', q3: 'isotopes' }).correct).toBe(false);
  });

  it('calculates isotope facts', () => {
    expect(massNumber(6, 7)).toBe(13);
    expect(isotopeName('Carbon', 6, 7)).toBe('Carbon-13');
    expect(isotopeStability(6, 7)).toBe('stable');
    expect(isotopeStability(6, 8)).toBe('borderline');
  });
});
