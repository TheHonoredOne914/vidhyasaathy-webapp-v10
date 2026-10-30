import { and, eq } from 'drizzle-orm';
import { expect, it } from 'vitest';
import { absentDays, istDay, shiftIstDay } from '@vidhyasaathy/core/streak';
import { backfillStreaks } from '../src/daily/backfill.ts';
import { touchStreak } from '../src/daily/streak-store.ts';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { openDatabase } from '../src/db/index.ts';
import { badgeCatalog, dushmanEntries, profiles, streakFreezeLedger, streakStates, streakTouches } from '../src/db/schema.ts';
import { PASSWORD, PIN } from './helpers.ts';

it('migrates the daily loop and keeps the demo streak stories idempotent', async () => {
  const database = openDatabase(':memory:');
  try {
    const now = Date.UTC(2026, 9, 24, 12);
    const today = istDay(now);
    await seedDemo(database.db, { password: PASSWORD, pin: PIN }, now, { rich: true });
    expect(database.db.select().from(badgeCatalog).all().map((row) => row.id).sort()).toEqual([
      'boss_buster', 'comeback_king', 'dushman_slayer', 'fixed_it',
    ]);
    const assignmentColumns = database.sqlite.pragma('table_info(assignment)') as { name: string }[];
    const notificationColumns = database.sqlite.pragma('table_info(notification)') as { name: string }[];
    const settingColumns = database.sqlite.pragma('table_info(notification_setting)') as { name: string }[];
    expect(assignmentColumns.some((column) => column.name === 'late_until')).toBe(true);
    expect(notificationColumns.some((column) => column.name === 'topic')).toBe(true);
    expect(settingColumns.some((column) => column.name === 'quiet_after_21')).toBe(true);

    const student = (name: string) => database.db.select().from(profiles).where(and(
      eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, name),
    )).get()!;
    const aarav = student('Aarav');
    const priya = student('Priya');
    const rohan = student('Rohan');
    expect(database.db.select().from(streakStates).where(eq(streakStates.profileId, aarav.id)).get()).toMatchObject({
      currentDays: 12, freezesHeld: 2, lastDay: shiftIstDay(today, -1),
    });
    expect(database.db.select().from(streakStates).where(eq(streakStates.profileId, priya.id)).get()).toMatchObject({
      currentDays: 5, freezesHeld: 1,
    });
    expect(database.db.select().from(streakFreezeLedger).where(and(
      eq(streakFreezeLedger.profileId, priya.id), eq(streakFreezeLedger.kind, 'consumed'),
    )).all()).toHaveLength(1);
    const rohanDays = database.db.select().from(streakTouches).where(eq(streakTouches.profileId, rohan.id)).all().map((row) => row.day);
    expect(rohanDays).toEqual([shiftIstDay(today, -4)]);
    expect(absentDays(rohanDays[0] ?? null, now)).toBe(3);
    expect(database.db.select().from(dushmanEntries).where(eq(dushmanEntries.profileId, aarav.id)).get()).toMatchObject({ status: 'active' });

    const filled = backfillStreaks(database.db, now);
    expect(backfillStreaks(database.db, now)).toEqual({ touches: 0, profiles: filled.profiles });
    expect(database.db.select().from(streakStates).where(eq(streakStates.profileId, aarav.id)).get()?.currentDays).toBe(12);

    touchStreak(database.db, aarav.id, DEMO_SCHOOL_ID, 'session_part', 'tap-1', now);
    touchStreak(database.db, aarav.id, DEMO_SCHOOL_ID, 'homework_submit', 'tap-2', now);
    const todayRows = database.db.select().from(streakTouches).where(and(
      eq(streakTouches.profileId, aarav.id), eq(streakTouches.day, today),
    )).all();
    expect(todayRows).toHaveLength(1);
    expect(database.db.select().from(streakStates).where(eq(streakStates.profileId, aarav.id)).get()?.currentDays).toBe(13);
    expect(database.sqlite.pragma('foreign_key_check')).toEqual([]);
  } finally { database.close(); }
});
