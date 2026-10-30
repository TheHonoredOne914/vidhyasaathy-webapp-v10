import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { evaluateBadges, type BadgeHistoryRow } from '@vidhyasaathy/core/badges';
import { dushmanRetirement } from '@vidhyasaathy/core/dushman';
import type { Level } from '@vidhyasaathy/core/learning';
import type { Db } from '../db/index.ts';
import { notifyBadge } from './notify.ts';
import { badgeAwards, dushmanEntries, dushmanEvents } from '../db/schema.ts';

function asLevel(value: number | null): Level | null {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
}

export function applyLearningAwards(db: Db, input: {
  schoolId: string; profileId: string; conceptId: string; evidenceId: string;
  fromLevel: number | null; toLevel: number | null; now: number;
}) {
  const history = (): BadgeHistoryRow[] => db.select().from(badgeAwards).where(eq(badgeAwards.profileId, input.profileId)).all()
    .map((row) => ({ badgeId: row.badgeId, scopeKey: row.scopeKey }));
  const awards = evaluateBadges({
    id: input.evidenceId, kind: 'mastery', conceptId: input.conceptId, fromLevel: input.fromLevel, toLevel: input.toLevel,
  }, history());
  const level = asLevel(input.toLevel);
  if (dushmanRetirement(level).retire) {
    const active = db.select().from(dushmanEntries).where(and(
      eq(dushmanEntries.profileId, input.profileId), eq(dushmanEntries.schoolId, input.schoolId),
      eq(dushmanEntries.conceptId, input.conceptId), eq(dushmanEntries.status, 'active'),
    )).all();
    for (const entry of active) {
      db.update(dushmanEntries).set({ status: 'retired', retiredAt: input.now, reason: 'mastered' }).where(eq(dushmanEntries.id, entry.id)).run();
      db.insert(dushmanEvents).values({
        id: randomUUID(), profileId: input.profileId, schoolId: input.schoolId, conceptId: input.conceptId,
        kind: 'retired', evidenceId: input.evidenceId, createdAt: input.now,
      }).run();
    }
    if (active.length) {
      awards.push(...evaluateBadges({
        id: input.evidenceId, kind: 'dushman_retired', conceptId: input.conceptId, toLevel: level,
      }, history()));
    }
  }
  for (const award of awards) {
    const inserted = db.insert(badgeAwards).values({
      id: `badge:${input.profileId}:${award.badgeId}:${award.scopeKey}`,
      profileId: input.profileId, schoolId: input.schoolId, badgeId: award.badgeId, scopeKey: award.scopeKey,
      triggerEventId: award.triggerEventId, awardedAt: input.now, seenAt: null,
    }).onConflictDoNothing().run();
    if (inserted.changes) notifyBadge(db, input.schoolId, input.profileId, award.badgeId, award.scopeKey, input.now);
  }
  return awards;
}
