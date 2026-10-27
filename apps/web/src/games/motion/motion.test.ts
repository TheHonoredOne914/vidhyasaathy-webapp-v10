import { describe, expect, it } from 'vitest';
import { accelerationValidator, equationValidator, game, speedValidator, uniformMotionValidator } from './index';
import { validateGame } from '../engine/types';

describe('Motion Highway validators', () => {
  it('checks uniform motion', () => { expect(uniformMotionValidator('uniform').correct).toBe(true); expect(uniformMotionValidator('non-uniform').correct).toBe(false); });
  it('checks speed', () => { expect(speedValidator({ speed: '12' }).correct).toBe(true); expect(speedValidator({ speed: '10' }).correct).toBe(false); });
  it('checks acceleration equations', () => { expect(accelerationValidator({ velocity: '11', distance: '28' }).correct).toBe(true); expect(accelerationValidator({ velocity: '10', distance: '28' }).correct).toBe(false); });
  it('checks v-t area equations and arena shape', () => { expect(equationValidator({ velocity: '10', distance: '21' }).correct).toBe(true); expect(equationValidator({ velocity: '9', distance: '21' }).correct).toBe(false); expect(() => validateGame(game)).not.toThrow(); expect(game.arena?.levels).toHaveLength(4); });
});
