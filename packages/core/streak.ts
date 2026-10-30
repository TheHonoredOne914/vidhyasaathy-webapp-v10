import type { Streak } from '@vidhyasaathy/contracts';

export const DAY_MS = 86400000;
export const IST_OFFSET_MS = 330 * 60000;
export const ABSENCE_DAYS = 3;
export const FREEZE_EVERY_DAYS = 5;
export const FREEZE_CAP = 2;
export const WELCOME_BACK = 'Welcome back — day 1 starts today';
export const STREAK_ACTS = ['session_part', 'game_round', 'warmup', 'daily_challenge', 'homework_submit', 'catchup', 'dushman'] as const;
export type StreakAct = (typeof STREAK_ACTS)[number];

export function isStreakAct(act: string): act is StreakAct {
  return (STREAK_ACTS as readonly string[]).includes(act);
}

export function istDayNumber(timestamp: number) {
  return Math.floor((timestamp + IST_OFFSET_MS) / DAY_MS);
}

export function dayFromNumber(day: number) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function istDay(timestamp: number) {
  return dayFromNumber(istDayNumber(timestamp));
}

export function shiftIstDay(day: string, delta: number) {
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) throw new RangeError('Invalid IST day.');
  return dayFromNumber(istDayNumber(Date.UTC(year, month - 1, date) - IST_OFFSET_MS) + delta);
}

/** Exclusive end of tomorrow in Asia/Kolkata. Due work before this instant is still "due". */
export function endOfTomorrowIst(now: number) {
  return (istDayNumber(now) + 2) * DAY_MS - IST_OFFSET_MS;
}

/** Full IST days after the last touch, not counting today. Never-touched students are not absent. */
export function absentDays(lastTouchDay: string | null, now: number) {
  if (!lastTouchDay) return 0;
  const [year, month, date] = lastTouchDay.split('-').map(Number);
  if (!year || !month || !date) return 0;
  const lastNum = istDayNumber(Date.UTC(year, month - 1, date) - IST_OFFSET_MS);
  return Math.max(0, istDayNumber(now) - lastNum - 1);
}

export interface StreakCache {
  currentDays: number;
  longestDays: number;
  lastDay: string | null;
  freezesHeld: number;
}

export interface StreakTouchInput {
  at: number;
  act: string;
}

export interface FreezeEntry {
  kind: 'earned' | 'consumed';
  day: string;
  reason: string;
}

export interface StreakUpdate {
  state: StreakCache;
  earned: FreezeEntry[];
  consumed: FreezeEntry[];
  restartCopy: string | null;
  touchedToday: boolean;
}

export function emptyStreak(): StreakCache {
  return { currentDays: 0, longestDays: 0, lastDay: null, freezesHeld: 0 };
}

/**
 * Replay touches after `state.lastDay`. One IST day counts once. Login is not an act.
 * A freeze is earned when the streak lands on a multiple of 5, and held at most 2.
 * A missed day spends one freeze or resets the streak. Today is not missed until it ends.
 */
export function applyStreakDay(state: StreakCache, touches: readonly StreakTouchInput[], freezes: readonly FreezeEntry[], today: number): StreakUpdate {
  if (!Number.isSafeInteger(today) || today < 0) throw new RangeError('Invalid streak time.');
  const todayNum = istDayNumber(today);
  const counted = new Set<number>();
  for (const touch of touches) {
    if (!isStreakAct(touch.act) || !Number.isSafeInteger(touch.at) || touch.at < 0 || touch.at > today) continue;
    const day = istDayNumber(touch.at);
    if (day <= todayNum) counted.add(day);
  }
  const earnedDays = new Set(freezes.filter((entry) => entry.kind === 'earned').map((entry) => entry.day));
  const consumedDays = new Set(freezes.filter((entry) => entry.kind === 'consumed').map((entry) => entry.day));
  let current = state.currentDays;
  let longest = state.longestDays;
  let held = Math.min(FREEZE_CAP, Math.max(0, state.freezesHeld));
  let last = state.lastDay;
  let restartCopy: string | null = null;
  const earned: FreezeEntry[] = [];
  const consumed: FreezeEntry[] = [];
  const lastNum = last ? Math.round(Date.parse(`${last}T00:00:00Z`) / DAY_MS) : null;
  const firstTouch = counted.size ? Math.min(...counted) : null;
  const start = lastNum === null ? firstTouch : lastNum + 1;
  if (start === null) {
    return { state: { currentDays: current, longestDays: longest, lastDay: last, freezesHeld: held }, earned, consumed, restartCopy, touchedToday: false };
  }
  for (let day = start; day <= todayNum; day += 1) {
    const label = dayFromNumber(day);
    if (counted.has(day)) {
      if (current === 0 && last !== null) restartCopy = WELCOME_BACK;
      current += 1;
      longest = Math.max(longest, current);
      last = label;
      if (current % FREEZE_EVERY_DAYS === 0 && !earnedDays.has(label)) {
        if (held < FREEZE_CAP) {
          held += 1;
          earned.push({ kind: 'earned', day: label, reason: `streak reached ${current} days` });
        }
        earnedDays.add(label);
      }
    } else if (day < todayNum) {
      if (consumedDays.has(label)) last = label;
      else if (current > 0 && held > 0) {
        held -= 1;
        consumed.push({ kind: 'consumed', day: label, reason: 'missed day' });
        consumedDays.add(label);
        last = label;
      } else if (current > 0) current = 0;
    }
  }
  return {
    state: { currentDays: current, longestDays: longest, lastDay: last, freezesHeld: held },
    earned, consumed, restartCopy, touchedToday: counted.has(todayNum),
  };
}

/** Input is server-marked correct practice only. No login/time/speed rewards or grace days. */
export function streak(correctTimestamps: readonly number[], now: number): Streak {
  if (!Number.isSafeInteger(now) || now < 0 || now > 8640000000000000 - DAY_MS) throw new RangeError('Invalid streak time.');
  const today = istDayNumber(now);
  const practiced = new Set(correctTimestamps.filter((at) => Number.isSafeInteger(at) && at >= 0 && at <= now).map(istDayNumber));
  const sorted = [...practiced].sort((a, b) => a - b);
  let longestDays = 0, run = 0, previous: number | undefined;
  for (const day of sorted) {
    run = previous === day - 1 ? run + 1 : 1;
    longestDays = Math.max(longestDays, run); previous = day;
  }
  let currentDays = 0;
  let cursor = practiced.has(today) ? today : today - 1;
  while (practiced.has(cursor--)) currentDays++;
  const last = sorted.at(-1);
  return { timezone: 'Asia/Kolkata', currentDays, longestDays, lastPracticedOn: last === undefined ? null : dayFromNumber(last), updatedAt: now,
    days: Array.from({ length: 7 }, (_, i) => ({ date: dayFromNumber(today - 6 + i), practiced: practiced.has(today - 6 + i) })) };
}
