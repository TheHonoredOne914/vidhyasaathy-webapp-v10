import { expect, it } from 'vitest';
import { buildDailyChallenge, type ChallengeItem } from './daily-challenge.ts';
import type { Level } from './learning.ts';

function item(id: string, conceptId: string, level: Level, extra: Partial<ChallengeItem> = {}): ChallengeItem {
  return { id, conceptId, level, seeded: true, ...extra };
}

const items: ChallengeItem[] = [
  item('f1', 'distance', 1), item('f2', 'distance', 2), item('f3', 'distance', 3),
  item('d1', 'speed', 1), item('d2', 'speed', 2), item('d3', 'speed', 3), item('d4', 'speed', 3, { board: true }),
  item('t1', 'acceleration', 1), item('t2', 'acceleration', 2), item('t3', 'acceleration', 3),
  item('draft', 'acceleration', 1, { seeded: false }),
];

const ctx = {
  fadingConceptIds: ['distance'],
  dushmanConceptIds: ['speed'],
  tonightConceptId: 'acceleration',
  ladderLevel: 3 as const,
  items,
};

it('fills five seeded questions from fading, Dushman, then tonight', () => {
  const challenge = buildDailyChallenge(ctx, '50-75');
  expect(challenge.itemIds).toHaveLength(5);
  expect(challenge.itemIds.filter((id) => id.startsWith('f'))).toHaveLength(2);
  expect(challenge.itemIds.filter((id) => id.startsWith('d'))).toHaveLength(2);
  expect(challenge.itemIds).toContain('t3');
  expect(challenge.itemIds).not.toContain('draft');
  expect(challenge).toMatchObject({ timerVisible: false, hindiTerms: false, showConfidence: true, maxMinutes: 5 });
  expect(buildDailyChallenge(ctx, '50-75').itemIds).toEqual(challenge.itemIds);
});

it('routes the band to a level band, Hindi terms, or a visible timer', () => {
  const repair = buildDailyChallenge(ctx, '0-25');
  expect(repair.itemIds.every((id) => items.find((row) => row.id === id)?.level === 1)).toBe(true);
  expect(repair.hindiTerms).toBe(true);
  expect(repair.itemIds.length).toBeLessThanOrEqual(5);
  const stretch = buildDailyChallenge(ctx, '75-100');
  expect(stretch.timerVisible).toBe(true);
  expect(stretch.itemIds.every((id) => (items.find((row) => row.id === id)?.level ?? 0) >= 3)).toBe(true);
  expect(stretch.itemIds[0]).toBe('f3');
});
