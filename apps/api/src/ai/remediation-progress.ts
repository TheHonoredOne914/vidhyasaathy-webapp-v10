import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { attempts, learningEvidence, remediationChecks } from '../db/schema.ts';
import { ApiException } from '../errors.ts';

export function remediationProgress(db: Db, schoolId: string, profileId: string, conceptId: string) {
  const failures = [
    ...db.select().from(attempts).where(and(eq(attempts.schoolId, schoolId), eq(attempts.profileId, profileId),
      eq(attempts.conceptId, conceptId), eq(attempts.correct, false))).all()
      .map((row) => ({ id: `attempt:${row.id}`, at: row.updatedAt })),
    ...db.select().from(learningEvidence).where(and(eq(learningEvidence.schoolId, schoolId), eq(learningEvidence.profileId, profileId),
      eq(learningEvidence.conceptId, conceptId), eq(learningEvidence.source, 'session'), eq(learningEvidence.correct, false))).all()
      .map((row) => ({ id: row.id, at: row.createdAt })),
  ].sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
  const failureId = failures[0]?.id ?? null;
  const checks = failureId ? db.select().from(remediationChecks).where(and(eq(remediationChecks.schoolId, schoolId),
    eq(remediationChecks.profileId, profileId), eq(remediationChecks.conceptId, conceptId), eq(remediationChecks.failureId, failureId)))
    .orderBy(remediationChecks.createdAt, remediationChecks.clientEventId).all() : [];
  return { failureId, checks, passed: checks.find((row) => row.result.passed) };
}

export function requireRemediationComplete(db: Db, schoolId: string, profileId: string, conceptId: string) {
  const progress = remediationProgress(db, schoolId, profileId, conceptId);
  if (progress.failureId && !progress.passed) {
    throw new ApiException(409, 'REMEDIATION_REQUIRED', 'Finish this concept’s lesson and two-question check before continuing. Ask your teacher if material is missing.');
  }
}
