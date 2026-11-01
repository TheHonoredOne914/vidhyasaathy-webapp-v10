import { describe, expect, it } from 'vitest';
import { type Mood, MOOD_ID } from './palette';

// CPU ports of sdArc / sdEll and the mood branches in particleMaterial.ts.
function ellipse(x: number, y: number, rx: number, ry: number) {
  return (Math.hypot(x / rx, y / ry) - 1) * Math.min(rx, ry);
}
function arc(x: number, y: number, angle: number, radius: number, width: number) {
  x = Math.abs(x);
  const sx = Math.sin(angle), sy = Math.cos(angle);
  return (sy * x > sx * y
    ? Math.hypot(x - sx * radius, y - sy * radius)
    : Math.abs(Math.hypot(x, y) - radius)) - width;
}
function mouth(x: number, y: number, mood: Mood) {
  switch (mood) {
    case 'smile': return arc(x, -(y + 0.06), 1, 0.13, 0.026);
    case 'grin': return Math.max(Math.hypot(x, y + 0.05) - 0.15, y + 0.05);
    case 'worried': return arc(x, y + 0.20, 0.8, 0.10, 0.024);
    case 'wow': return ellipse(x, y + 0.10, 0.06, 0.075);
  }
}
describe('camera-facing face SDF symmetry', () => {
  it.each(Object.keys(MOOD_ID) as Mood[])('%s is mirror-symmetric at 50 sample points, including blinking eyes', (mood) => {
    for (let i = 0; i < 50; i++) {
      const x = (i + 0.5) / 50, y = Math.sin(i * 2.4) * 0.5;
      expect(mouth(x, y, mood)).toBe(mouth(-x, y, mood));
      for (const blink of [0, 0.5, 1]) {
        const eye = (px: number) => ellipse(Math.abs(px) - 0.235, y - 0.10, 0.068, 0.092 * (1 - 0.88 * blink));
        expect(eye(x)).toBe(eye(-x));
      }
    }
  });
});
