import { describe, expect, it } from 'vitest';
import { chapterStops } from './chapterWorld';

describe('chapter path', () => {
  it('counts real modules and games without claiming mastery', () => {
    const stops = chapterStops('motion', { explorer: 2, concept: 3, guided_example: 1, practice: 4, repair: 2, revision: 1, games: 2 }, false);
    expect(stops).toHaveLength(6);
    expect(stops.find((stop) => stop.key === 'fix')?.state).toBe('locked');
    expect(stops.find((stop) => stop.key === 'play')?.detail).toBe('2 chapter games');
    expect(stops.every((stop) => stop.state !== 'done')).toBe(true);
  });
  it('opens repair only for evidence needing repair', () => {
    expect(chapterStops('motion', { repair: 2 }, true).find((stop) => stop.key === 'fix')?.state).toBe('open');
  });
});
