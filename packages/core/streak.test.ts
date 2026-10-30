import { StreakSchema } from '@vidhyasaathy/contracts';
import { expect, it } from 'vitest';
import { absentDays, applyStreakDay, emptyStreak, istDay, shiftIstDay, streak, WELCOME_BACK } from './streak.ts';

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

const noon = (label: string) => {
  const [year, month, date] = label.split('-').map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) - 330 * 60_000 + 12 * 60 * 60 * 1000;
};

it('earns a freeze from day 4 to 5 and holds the cap at day 10', () => {
  const today = '2026-10-24';
  const step = applyStreakDay(
    { currentDays: 4, longestDays: 4, lastDay: shiftIstDay(today, -1), freezesHeld: 0 },
    [{ at: noon(today), act: 'session_part' }], [], noon(today),
  );
  expect(step.state).toMatchObject({ currentDays: 5, freezesHeld: 1, lastDay: today });
  expect(step.earned).toHaveLength(1);
  const capped = applyStreakDay(
    { currentDays: 9, longestDays: 9, lastDay: shiftIstDay(today, -1), freezesHeld: 2 },
    [{ at: noon(today), act: 'session_part' }], [], noon(today),
  );
  expect(capped.state).toMatchObject({ currentDays: 10, freezesHeld: 2 });
  expect(capped.earned).toEqual([]);
});

it('resets when two missed days meet a single freeze', () => {
  const today = '2026-10-24';
  const update = applyStreakDay(
    { currentDays: 5, longestDays: 5, lastDay: shiftIstDay(today, -3), freezesHeld: 1 },
    [{ at: noon(today), act: 'catchup' }], [], noon(today),
  );
  expect(update.consumed).toHaveLength(1);
  expect(update.state).toMatchObject({ currentDays: 1, freezesHeld: 0, lastDay: today });
  expect(update.restartCopy).toBe(WELCOME_BACK);
});

it('counts a midnight IST pair as two days and a same-second double tap as one', () => {
  const midnight = Date.UTC(2026, 9, 24, 18, 30);
  const crossed = applyStreakDay(emptyStreak(), [
    { at: midnight - 1000, act: 'session_part' },
    { at: midnight + 1000, act: 'daily_challenge' },
  ], [], midnight + 1000);
  expect(crossed.state.currentDays).toBe(2);
  expect(istDay(midnight - 1000)).not.toBe(istDay(midnight + 1000));
  const at = noon('2026-10-24');
  expect(applyStreakDay(emptyStreak(), [
    { at, act: 'session_part' }, { at, act: 'homework_submit' },
  ], [], at).state.currentDays).toBe(1);
  expect(applyStreakDay(emptyStreak(), [{ at, act: 'login' }], [], at).state.currentDays).toBe(0);
});

it('keeps Priya at 5 days with one freeze and Rohan absent for 3 full days', () => {
  const now = Date.UTC(2026, 9, 24, 12);
  const today = istDay(now);
  const priya = [-14, -13, -12, -11, -10, -5, -4, -3, -2, -1].map((offset) => shiftIstDay(today, offset));
  const update = applyStreakDay(emptyStreak(), priya.map((day) => ({ at: noon(day), act: 'session_part' })), [], now);
  expect(update.state).toMatchObject({ currentDays: 5, freezesHeld: 1 });
  expect(update.consumed).toHaveLength(1);
  const rohan = applyStreakDay(emptyStreak(), [{ at: noon(shiftIstDay(today, -4)), act: 'session_part' }], [], now);
  expect(rohan.state).toMatchObject({ currentDays: 0, freezesHeld: 0, lastDay: shiftIstDay(today, -4) });
  expect(absentDays(rohan.state.lastDay, now)).toBe(3);
  expect(absentDays(shiftIstDay(today, -4), now)).toBe(3);
  expect(absentDays(shiftIstDay(today, -1), now)).toBe(0);
  expect(absentDays(null, now)).toBe(0);
});
