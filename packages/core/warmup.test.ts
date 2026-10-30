import { expect, it } from 'vitest';
import { buildWarmup, type WarmupPrereq } from './warmup.ts';

const cards = [
  { front: 'Distance', back: 'The whole path.' },
  { front: 'Displacement', back: 'Start to finish.' },
  { front: 'Scalar', back: 'Size only.' },
];

function prereq(conceptId: string, count = 3): WarmupPrereq {
  return { conceptId, name: conceptId, flashcards: cards.slice(0, count), checks: [{ id: `${conceptId}-l1`, level: 1 }] };
}

it('offers up to two fading prerequisites and hides a skipped day', () => {
  const prereqs = [prereq('distance'), prereq('units'), prereq('graphs'), prereq('speed', 1)];
  const offer = buildWarmup('acceleration', prereqs, [{ conceptId: 'distance' }, { conceptId: 'units' }, { conceptId: 'graphs' }], { today: '2026-10-24' });
  expect(offer).toMatchObject({ estMinutes: 2, tonightConceptId: 'acceleration' });
  expect(offer?.concepts.map((row) => row.conceptId)).toEqual(['distance', 'units']);
  expect(offer?.concepts[0]?.cards).toHaveLength(3);
  expect(offer?.concepts[0]?.checkId).toBe('distance-l1');
  expect(buildWarmup('acceleration', prereqs, [], { today: '2026-10-24' })).toBeNull();
  expect(buildWarmup('acceleration', prereqs, [{ conceptId: 'distance' }], { skippedDay: '2026-10-24', today: '2026-10-24' })).toBeNull();
  expect(buildWarmup('distance', [prereq('distance')], [{ conceptId: 'distance' }], { today: '2026-10-24' })).toBeNull();
});
