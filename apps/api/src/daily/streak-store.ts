import { and, eq } from 'drizzle-orm';
import { applyStreakDay, emptyStreak, istDay, type StreakAct, type StreakTouchInput } from '@vidhyasaathy/core/streak';
import type { Db } from '../db/index.ts';
import { streakFreezeLedger, streakStates, streakTouches } from '../db/schema.ts';

export function actForSource(source: string): StreakAct {
  if (source === 'homework') return 'homework_submit';
  if (source.startsWith('game:')) return 'game_round';
  return 'session_part';
}

export function persistStreak(db: Db, profileId: string, schoolId: string, touches: readonly StreakTouchInput[], now: number) {
  const update = applyStreakDay(emptyStreak(), touches, [], now);
  const state = update.state;
  db.insert(streakStates).values({
    profileId, schoolId, currentDays: state.currentDays, longestDays: state.longestDays,
    lastDay: state.lastDay, freezesHeld: state.freezesHeld, updatedAt: now,
  }).onConflictDoUpdate({
    target: streakStates.profileId,
    set: { schoolId, currentDays: state.currentDays, longestDays: state.longestDays, lastDay: state.lastDay, freezesHeld: state.freezesHeld, updatedAt: now },
  }).run();
  for (const entry of [...update.earned, ...update.consumed]) {
    db.insert(streakFreezeLedger).values({
      id: `freeze:${profileId}:${entry.kind}:${entry.day}`, profileId, schoolId,
      kind: entry.kind, day: entry.day, reason: entry.reason, createdAt: now,
    }).onConflictDoNothing().run();
  }
  return update;
}

export function rebuildProfileStreak(db: Db, profileId: string, schoolId: string, now: number) {
  const rows = db.select().from(streakTouches).where(and(eq(streakTouches.profileId, profileId), eq(streakTouches.schoolId, schoolId))).all();
  return persistStreak(db, profileId, schoolId, rows.map((row) => ({ at: row.createdAt, act: row.act })), now);
}

/** One row per IST day. A second tap the same day does not move the streak. */
export function touchStreak(db: Db, profileId: string, schoolId: string, act: StreakAct, sourceEventId: string | null, now: number) {
  db.insert(streakTouches).values({
    profileId, schoolId, day: istDay(now), act, sourceEventId, createdAt: now,
  }).onConflictDoNothing().run();
  return rebuildProfileStreak(db, profileId, schoolId, now);
}
