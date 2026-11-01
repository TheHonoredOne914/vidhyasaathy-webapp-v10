import { describe, expect, it } from 'vitest';
import { BEATS, RECAP } from './beats';

describe('Atom Forge cutscene beats', () => {
  it('has exactly the six approved hand-offs, in order', () => {
    expect(BEATS.map((beat) => beat.act)).toEqual(['hold-zoom', 'spin-tap', 'neutron-drag', 'shell-place', 'isotope-sort', 'free-build']);
    expect(new Set(BEATS.map((beat) => beat.id)).size).toBe(6);
  });
  it.each(BEATS)('$id has a timed cutscene, framing, hint and payoff', (beat) => {
    expect(beat.actAt).toBeGreaterThanOrEqual(6);
    expect(beat.actAt).toBeLessThanOrEqual(12);
    expect(beat.hint.length).toBeGreaterThan(0);
    expect(beat.payoff).toContain('<b>');
    expect(beat.bg).toHaveLength(2);
    expect(beat.camera[0]!.ms).toBe(0);
    expect(beat.camera.at(-1)!.ms).toBe(beat.actAt * 1000);
    beat.camera.forEach((key, i) => {
      expect(key.position).toHaveLength(3);
      expect(key.target).toHaveLength(3);
      expect(key.fov).toBeGreaterThan(0);
      if (i) expect(key.ms).toBeGreaterThan(beat.camera[i - 1]!.ms);
    });
  });
  it('keeps captions short, safe and focused on one key term', () => {
    for (const beat of BEATS) for (const caption of [...beat.captions, beat.payoff]) {
      expect(caption.match(/<b>/g)).toHaveLength(1);
      expect(caption.match(/<\/b>/g)).toHaveLength(1);
      expect(caption.split('\n').length).toBeLessThanOrEqual(2);
      expect(caption.replace(/<\/?b>/g, '').split(/\s+/).length).toBeLessThanOrEqual(22);
    }
  });
  it('ends with four concept recap cards', () => expect(RECAP).toHaveLength(4));
});
