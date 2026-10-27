import { MIN_ANALYTICS_ATTEMPTS } from '@vidhyasaathy/contracts';
import { CONCEPT_PASS_THRESHOLD } from '@vidhyasaathy/core/remediation';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/index.ts';
import { concepts, dashboardJobs, parentLinks, profiles, studentConceptStates } from '../db/schema.ts';
import { deliverNotifications, queueNotification } from './notifications.ts';

// Durable dirty flags are set by evidence/enrollment triggers, including offline sync and manual marking.
export function runDashboardJobs(database: Database, timestamp: number, schoolId?: string) {
  const { db } = database;
  const jobs = db.select().from(dashboardJobs).where(and(eq(dashboardJobs.dirty, true),
    schoolId ? eq(dashboardJobs.schoolId, schoolId) : undefined)).all();
  for (const job of jobs) db.transaction(() => {
    db.run(sql`DELETE FROM class_concept_daily WHERE school_id = ${job.schoolId}`);
    db.run(sql`INSERT INTO class_concept_daily (school_id, section_id, concept_id, day, attempts, correct, pending_review)
      SELECT e.school_id, p.section_id, e.concept_id, date(e.recorded_at / 1000, 'unixepoch'),
        count(e.correct), sum(e.correct = 1), sum(e.correct IS NULL)
      FROM (
        SELECT school_id, profile_id, concept_id, correct, server_ts AS recorded_at FROM attempt
        UNION ALL SELECT school_id, profile_id, concept_id, correct, created_at FROM learning_evidence
      ) e JOIN profile p ON p.id = e.profile_id AND p.school_id = e.school_id
      WHERE e.school_id = ${job.schoolId} AND p.role = 'student' AND p.section_id IS NOT NULL
      GROUP BY e.school_id, p.section_id, e.concept_id, date(e.recorded_at / 1000, 'unixepoch')`);
    db.run(sql`DELETE FROM misconception_daily WHERE school_id = ${job.schoolId}`);
    db.run(sql`INSERT INTO misconception_daily (school_id, section_id, concept_id, item_id, day, option, count)
      SELECT a.school_id, p.section_id, a.concept_id, a.item_id, date(a.server_ts / 1000, 'unixepoch'),
        json_extract(a.answer, '$'), count(*)
      FROM attempt a JOIN profile p ON p.id = a.profile_id AND p.school_id = a.school_id
      JOIN item i ON i.id = a.item_id AND i.school_id = a.school_id
      WHERE a.school_id = ${job.schoolId} AND p.section_id IS NOT NULL AND p.role = 'student'
        AND a.correct = 0 AND json_extract(i.content, '$.type') = 'mcq'
        AND json_type(a.answer) = 'text'
      GROUP BY a.school_id, p.section_id, a.concept_id, a.item_id, date(a.server_ts / 1000, 'unixepoch'), json_extract(a.answer, '$')`);
    const gaps = db.select({ state: studentConceptStates, concept: concepts, child: profiles, link: parentLinks })
      .from(studentConceptStates).innerJoin(concepts, eq(concepts.id, studentConceptStates.conceptId))
      .innerJoin(profiles, eq(profiles.id, studentConceptStates.profileId))
      .innerJoin(parentLinks, and(eq(parentLinks.studentProfileId, profiles.id), eq(parentLinks.schoolId, job.schoolId)))
      .where(eq(studentConceptStates.schoolId, job.schoolId)).all();
    for (const { state, concept, child, link } of gaps) {
      if (state.attempts < MIN_ANALYTICS_ATTEMPTS || state.mastery >= CONCEPT_PASS_THRESHOLD) continue;
      queueNotification(db, { schoolId: job.schoolId, profileId: link.parentProfileId, kind: 'parent_summary',
        dedupeKey: `parent:${link.parentProfileId}:${child.id}:${concept.id}`, title: `Practice ${concept.title}`,
        body: `${child.name} could use practice with ${concept.title}. Review the learning summary and help with the suggested next step.`,
        href: `/parent/children/${child.id}`, channel: 'in_app', createdAt: timestamp });
    }
    db.update(dashboardJobs).set({ dirty: false, refreshedAt: timestamp }).where(eq(dashboardJobs.schoolId, job.schoolId)).run();
  });
  deliverNotifications(db, timestamp, schoolId);
}
