import { describe, expect, it } from 'vitest';
import { packNucleus } from './nucleus';

describe('seeded nucleus packing', () => {
  it('repeats positions and interleaved particle kinds for a seed', () => {
    expect(packNucleus(6, 6)).toEqual(packNucleus(6, 6));
    expect(packNucleus(6, 6, 0.5, 8)).not.toEqual(packNucleus(6, 6));
  });

  it.each([[6, 6], [6, 8], [11, 12]])('keeps %i protons and %i neutrons separated', (p, n) => {
    const particles = packNucleus(p, n);
    expect(particles.filter(({ kind }) => kind === 'p')).toHaveLength(p);
    expect(particles.filter(({ kind }) => kind === 'n')).toHaveLength(n);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        expect(particles[i]!.pos.distanceTo(particles[j]!.pos)).toBeGreaterThanOrEqual(0.9);
      }
    }
  });
});
