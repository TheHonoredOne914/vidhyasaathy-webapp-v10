import { and, eq } from 'drizzle-orm';
import { DAY_MS, IST_OFFSET_MS, istDay, shiftIstDay } from '@vidhyasaathy/core/streak';
import type { Db } from './index.ts';
import {
  badgeCatalog, chapters, conceptLadders, concepts, dushmanEntries, dushmanEvents, profiles, streakTouches, studentConceptStates,
} from './schema.ts';
import { rebuildProfileStreak } from '../daily/streak-store.ts';

const BADGES = [
  { id: 'fixed_it' as const, nameEn: 'Fixed It', nameHi: 'ठीक कर लिया', descriptionEn: 'A shaky idea is steadier now.', descriptionHi: 'एक डगमगाता विचार अब स्थिर है।', iconKey: 'badge-fixed' },
  { id: 'comeback_king' as const, nameEn: 'Comeback King', nameHi: 'वापसी', descriptionEn: 'You came back and finished the small steps.', descriptionHi: 'तुम लौटे और छोटे कदम पूरे किए।', iconKey: 'badge-comeback' },
  { id: 'dushman_slayer' as const, nameEn: 'Dushman Slayer', nameHi: 'दुश्मन हराया', descriptionEn: 'A repeated mistake has been put to rest.', descriptionHi: 'एक दोहराई गलती अब शांत है।', iconKey: 'badge-dushman' },
  { id: 'boss_buster' as const, nameEn: 'Boss Buster', nameHi: 'कठिन सवाल', descriptionEn: 'Saved for a later challenge.', descriptionHi: 'यह बाद की चुनौती के लिए रखा है।', iconKey: 'badge-boss' },
];

function noonIst(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) - IST_OFFSET_MS + 12 * 60 * 60 * 1000;
}

function touchDays(profileId: string, schoolId: string, name: string, days: readonly string[], db: Db) {
  for (const day of days) {
    db.insert(streakTouches).values({
      profileId, schoolId, day, act: 'session_part', sourceEventId: `demo:streak:${name}:${day}`, createdAt: noonIst(day),
    }).onConflictDoNothing().run();
  }
}

/** Idempotent demo history for the daily loop. Existing accounts and answers stay. */
export function ensureDailyLoop(db: Db, schoolId: string, now: number) {
  for (const badge of BADGES) db.insert(badgeCatalog).values(badge).onConflictDoNothing().run();
  const students = db.select().from(profiles).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, 'student'))).all();
  const byName = new Map(students.map((row) => [row.name, row.id]));
  const chapter = db.select().from(chapters).where(and(eq(chapters.schoolId, schoolId), eq(chapters.title, 'Motion'))).get();
  if (!chapter) return;
  const conceptRows = db.select().from(concepts).where(eq(concepts.chapterId, chapter.id)).all();
  const conceptId = (title: string) => conceptRows.find((row) => row.title === title)?.id;
  const distanceId = conceptId('Distance & Displacement');
  const speedId = conceptId('Speed & Velocity');
  const accelerationId = conceptId('Acceleration');
  const today = istDay(now);
  const yesterday = shiftIstDay(today, -1);

  const aarav = byName.get('Aarav');
  if (aarav) {
    const days = Array.from({ length: 12 }, (_, index) => shiftIstDay(yesterday, index - 11));
    touchDays(aarav, schoolId, 'Aarav', days, db);
    rebuildProfileStreak(db, aarav, schoolId, now);
    if (speedId) {
      db.insert(dushmanEntries).values({
        id: `demo:dushman:${aarav}:speed`, profileId: aarav, schoolId, conceptId: speedId,
        status: 'active', queuedAt: now, retiredAt: null, reason: 'seed',
      }).onConflictDoNothing().run();
      db.insert(dushmanEvents).values({
        id: `demo:dushman-event:${aarav}:speed`, profileId: aarav, schoolId, conceptId: speedId,
        kind: 'queued', evidenceId: null, createdAt: now,
      }).onConflictDoNothing().run();
    }
    for (const id of [distanceId, speedId, accelerationId]) {
      if (id) setReview(db, schoolId, aarav, id, now + 7 * DAY_MS, 0.9, now);
    }
  }

  const priya = byName.get('Priya');
  if (priya) {
    const days = [-14, -13, -12, -11, -10, -5, -4, -3, -2, -1].map((offset) => shiftIstDay(today, offset));
    touchDays(priya, schoolId, 'Priya', days, db);
    rebuildProfileStreak(db, priya, schoolId, now);
    if (distanceId) setReview(db, schoolId, priya, distanceId, now - DAY_MS, 0.55, now - DAY_MS);
    if (speedId) {
      db.insert(conceptLadders).values({
        schoolId, profileId: priya, conceptId: speedId, ladderLevel: 1, streakCorrect: 0, streakWrong: 2,
        masteryLevel: 1, masteryScore: 0.2, misconception: true, bridge: "Let's warm up with a simpler one", updatedAt: now,
      }).onConflictDoNothing().run();
    }
  }

  const rohan = byName.get('Rohan');
  if (rohan) {
    touchDays(rohan, schoolId, 'Rohan', [shiftIstDay(today, -4)], db);
    rebuildProfileStreak(db, rohan, schoolId, now);
    for (const id of [distanceId, speedId]) {
      if (!id) continue;
      const when = now - 10 * DAY_MS;
      setReview(db, schoolId, rohan, id, now - 5 * DAY_MS, 0.2, when);
      db.insert(conceptLadders).values({
        schoolId, profileId: rohan, conceptId: id, ladderLevel: 1, streakCorrect: 0, streakWrong: 1,
        masteryLevel: 1, masteryScore: 0.2, misconception: false, bridge: null, updatedAt: when,
      }).onConflictDoNothing().run();
    }
  }
}

function setReview(db: Db, schoolId: string, profileId: string, conceptId: string, nextReview: number, mastery: number, updatedAt: number) {
  db.insert(studentConceptStates).values({
    schoolId, profileId, conceptId, mastery, leitnerBox: 2, nextReview, attempts: 1, updatedAt,
  }).onConflictDoNothing().run();
}
