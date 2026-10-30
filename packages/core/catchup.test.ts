import { expect, it } from 'vitest';
import { buildCatchup, CATCHUP_COPY } from './catchup.ts';

it('builds a 20 minute path after three absent days and stays quiet before that', () => {
  const tonight = { conceptId: 'acceleration', name: 'Acceleration' };
  const decayed = [
    { conceptId: 'speed', name: 'Speed', decayed: 0.2 },
    { conceptId: 'distance', name: 'Distance', decayed: 0.1 },
    { conceptId: 'graphs', name: 'Graphs', decayed: 0.4 },
  ];
  expect(buildCatchup({ absentDays: 2, decayed, tonight })).toBeNull();
  const plan = buildCatchup({ absentDays: 3, decayed, tonight });
  expect(plan?.copy).toBe(CATCHUP_COPY);
  expect(plan?.estMinutes).toBe(20);
  expect(plan?.steps.map((step) => [step.conceptId, step.estMinutes, step.note, step.questions])).toEqual([
    ['distance', 5, 'simple', 2],
    ['speed', 5, 'simple', 2],
    ['acceleration', 10, 'standard', 3],
  ]);
  expect(plan?.events).toEqual({ offered: 'recovery_offered', completed: 'recovery_completed' });
});
