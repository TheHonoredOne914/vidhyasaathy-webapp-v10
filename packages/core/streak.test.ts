import { StreakSchema } from '@vidhyasaathy/contracts';
import { expect, it } from 'vitest';
import { streak } from './streak.ts';

const day = 86400000;
const now = Date.UTC(2026, 9, 25, 12);

it('deduplicates correct practice by Indian calendar day and keeps yesterday active', () => {
  expect(StreakSchema.parse(streak([now, now - 100, now - day, now - 2 * day], now))).toMatchObject({ currentDays: 3, longestDays: 3, lastPracticedOn: '2026-10-25' });
  expect(streak([now - day, now - 2 * day], now).currentDays).toBe(2);
  expect(streak([], now)).toMatchObject({ currentDays: 0, longestDays: 0, lastPracticedOn: null });
  expect(streak([], now).days).toHaveLength(7);
});

it('uses midnight Asia/Kolkata rather than UTC and resets after a missed day', () => {
  const midnight = Date.UTC(2026, 9, 24, 18, 30);
  const state = streak([midnight - 1, midnight], midnight);
  expect(state.currentDays).toBe(2);
  expect(state.days.slice(-2)).toEqual([{ date: '2026-10-24', practiced: true }, { date: '2026-10-25', practiced: true }]);
  expect(streak([now - 2 * day, now - 3 * day, now - 4 * day], now)).toMatchObject({ currentDays: 0, longestDays: 3 });
});

it('ignores future/invalid evidence and does not invent grace days', () => {
  expect(streak([now + day, NaN, -1, Infinity, now - 2 * day, now], now)).toMatchObject({ currentDays: 1, longestDays: 1 });
  expect(() => streak([], NaN)).toThrow(RangeError);
});
