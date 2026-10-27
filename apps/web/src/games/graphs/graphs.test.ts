import { describe, expect, it } from 'vitest';
import { validateGame } from '../engine/types';
import { loadGame } from '../engine/registry';
import { game } from './index';
import { checkAxesOrigin, checkDistance, checkPlotPoint, checkQuadrant } from './validators';

describe('Coordinate Geometry and Linear Equations lab', () => {
  it('passes engine validation', () => {
    expect(() => validateGame(game)).not.toThrow();
  });

  it('loads through the registry and passes engine validation', async () => {
    const loadedGame = await loadGame('graphs');
    expect(loadedGame).not.toBeNull();
    expect(() => validateGame(loadedGame!)).not.toThrow();
  });

  it('checks each coordinate arena level', () => {
    expect(checkAxesOrigin('0,0').correct).toBe(true);
    expect(checkAxesOrigin('1,0').correct).toBe(false);
    expect(checkQuadrant('-2,3').correct).toBe(true);
    expect(checkQuadrant('2,3').correct).toBe(false);
    expect(checkPlotPoint('-3,2').correct).toBe(true);
    expect(checkPlotPoint('-3,-2').correct).toBe(false);
    expect(checkDistance('4,0').correct).toBe(true);
    expect(checkDistance('4,1').correct).toBe(false);
  });
});
