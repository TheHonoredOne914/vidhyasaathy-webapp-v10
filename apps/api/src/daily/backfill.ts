import { istDay, type StreakAct } from '@vidhyasaathy/core/streak';
import type { Db } from '../db/index.ts';
import { answerEvidence, attempts, learningEvidence, streakTouches } from '../db/schema.ts';
import { rebuildProfileStreak } from './streak-store.ts';

interface TouchSeed { profileId: string; schoolId: string; at: number; act: StreakAct; sourceEventId: string }

/** Past correct attempts and evidence become one touch per IST day. Today stays untouched. */
export function backfillStreaks(db: Db, now = Date.now()) {
  const today = istDay(now);
  const seeds: TouchSeed[] = [];
  for (const row of db.select().from(attempts).all()) {
    if (row.correct !== true || istDay(row.serverTs) >= today) continue;
    seeds.push({
      profileId: row.profileId, schoolId: row.schoolId, at: row.serverTs,
      act: row.assignmentId ? 'homework_submit' : 'session_part', sourceEventId: row.id,
    });
  }
  for (const row of db.select().from(answerEvidence).all()) {
    if (!row.correct || row.notTaught || istDay(row.createdAt) >= today) continue;
    const act: StreakAct = row.source === 'homework' ? 'homework_submit' : row.source.startsWith('game:') ? 'game_round' : 'session_part';
    seeds.push({ profileId: row.profileId, schoolId: row.schoolId, at: row.createdAt, act, sourceEventId: row.id });
  }
  for (const row of db.select().from(learningEvidence).all()) {
    if (!row.correct || istDay(row.createdAt) >= today) continue;
    seeds.push({ profileId: row.profileId, schoolId: row.schoolId, at: row.createdAt, act: 'session_part', sourceEventId: row.id });
  }
  seeds.sort((a, b) => a.at - b.at || a.sourceEventId.localeCompare(b.sourceEventId));
  let inserted = 0;
  for (const seed of seeds) {
    const wrote = db.insert(streakTouches).values({
      profileId: seed.profileId, schoolId: seed.schoolId, day: istDay(seed.at), act: seed.act,
      sourceEventId: seed.sourceEventId, createdAt: seed.at,
    }).onConflictDoNothing().run();
    inserted += wrote.changes;
  }
  const profiles = new Map<string, { profileId: string; schoolId: string }>();
  for (const row of db.select().from(streakTouches).all()) profiles.set(`${row.schoolId}:${row.profileId}`, row);
  for (const profile of profiles.values()) rebuildProfileStreak(db, profile.profileId, profile.schoolId, now);
  return { touches: inserted, profiles: profiles.size };
}
