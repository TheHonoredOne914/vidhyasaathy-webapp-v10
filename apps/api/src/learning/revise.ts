import { revisionDueAt } from '@vidhyasaathy/core/learn';
import type { Db } from '../db/index.ts';
import { revisionHooks } from '../db/schema.ts';

export function enqueueRevision(db: Db, schoolId: string, profileId: string, conceptId: string, now: number) {
  for (const hook of revisionDueAt(now)) {
    db.insert(revisionHooks).values({
      schoolId, profileId, conceptId, intervalDays: hook.days, dueAt: hook.dueAt, createdAt: now,
    }).onConflictDoNothing().run();
  }
}
