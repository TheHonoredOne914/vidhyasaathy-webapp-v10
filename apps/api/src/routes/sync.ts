import { SyncQuerySchema, type SyncCursors, type SyncResponse } from '@vidhyasaathy/contracts';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { assignmentView } from '../assessment/service.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { assignments, attempts, items, profiles, studentConceptStates, syncChanges } from '../db/schema.ts';
import { parseInput } from '../errors.ts';
import { found, scope } from '../school/access.ts';

export function registerSyncRoutes(app: FastifyInstance, db: Db, now: () => number) {
  const student = { preHandler: requireRole('student') };
  app.get('/concept-states', student, async (request) => {
    const { school, profile } = requireAuth(request);
    return db.select().from(studentConceptStates).where(and(eq(studentConceptStates.schoolId, school.id),
      eq(studentConceptStates.profileId, profile.id))).orderBy(studentConceptStates.nextReview).all();
  });
  app.get('/sync', student, async (request): Promise<SyncResponse> => {
    const query = parseInput(SyncQuerySchema, request.query);
    const { school, profile } = requireAuth(request);
    return db.transaction(() => {
      const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
      const result: SyncResponse = { updatedAt: now(), cursors: { assignments: query.assignments, items: query.items,
        attempts: query.attempts, conceptStates: query.conceptStates },
      hasMore: { assignments: false, items: false, attempts: false, conceptStates: false },
      assignments: [], items: [], attempts: [], conceptStates: [] };
      for (const stream of ['assignments', 'items', 'attempts', 'conceptStates'] satisfies (keyof SyncCursors)[]) {
        const content = stream === 'assignments' || stream === 'items';
        const changes = db.select({ change: syncChanges }).from(syncChanges)
          .leftJoin(assignments, eq(assignments.id, syncChanges.assignmentId))
          .where(and(eq(syncChanges.schoolId, school.id), eq(syncChanges.stream, stream), gt(syncChanges.seq, query[stream]),
            content ? and(eq(assignments.schoolId, school.id), eq(assignments.status, 'published'),
              eq(assignments.sectionId, enrolled.sectionId ?? ''), or(isNull(syncChanges.profileId), eq(syncChanges.profileId, profile.id)))
              : eq(syncChanges.profileId, profile.id)))
          .orderBy(syncChanges.seq).limit(query.limit + 1).all().map(({ change }) => change);
        result.hasMore[stream] = changes.length > query.limit;
        const page = changes.slice(0, query.limit);
        const last = page.at(-1);
        if (last) result.cursors[stream] = last.seq;
        for (const id of new Set(page.map((change) => change.entityId))) {
          if (stream === 'assignments') {
            result.assignments.push(assignmentView(db, request, found(db.select().from(assignments).where(scope(assignments, school.id, id)).get())));
          } else if (stream === 'items') {
            result.items.push(publicItem(found(db.select().from(items).where(scope(items, school.id, id)).get())));
          } else if (stream === 'attempts') {
            const row = found(db.select().from(attempts).where(and(scope(attempts, school.id, id), eq(attempts.profileId, profile.id))).get());
            if (row.assignmentId !== null) result.attempts.push({ ...row, assignmentId: row.assignmentId });
          } else {
            result.conceptStates.push(found(db.select().from(studentConceptStates).where(and(eq(studentConceptStates.schoolId, school.id),
              eq(studentConceptStates.profileId, profile.id), eq(studentConceptStates.conceptId, id))).get()));
          }
        }
      }
      return result;
    });
  });
}
