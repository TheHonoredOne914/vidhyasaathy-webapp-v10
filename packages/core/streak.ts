import type { Streak } from '@vidhyasaathy/contracts';

const DAY = 86400000;
const OFFSET = 330 * 60000;
const dayNumber = (timestamp: number) => Math.floor((timestamp + OFFSET) / DAY);
const date = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);

/** Input is server-marked correct practice only. No login/time/speed rewards or grace days. */
export function streak(correctTimestamps: readonly number[], now: number): Streak {
  if (!Number.isSafeInteger(now) || now < 0 || now > 8640000000000000 - DAY) throw new RangeError('Invalid streak time.');
  const today = dayNumber(now);
  const practiced = new Set(correctTimestamps.filter((at) => Number.isSafeInteger(at) && at >= 0 && at <= now).map(dayNumber));
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
  return { timezone: 'Asia/Kolkata', currentDays, longestDays, lastPracticedOn: last === undefined ? null : date(last), updatedAt: now,
    days: Array.from({ length: 7 }, (_, i) => ({ date: date(today - 6 + i), practiced: practiced.has(today - 6 + i) })) };
}
