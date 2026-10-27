import type { Remediation } from '@vidhyasaathy/contracts';
import { selectPrerequisiteGap } from '@vidhyasaathy/core/remediation';
import { and, eq, inArray } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import { chapterAccess } from '../content/access.ts';
import { publicItem } from '../content/sessions.ts';
import type { Database } from '../db/index.ts';
import { concepts, items, profiles } from '../db/schema.ts';
import { found, scope } from '../school/access.ts';
import { remediationProgress } from './remediation-progress.ts';

export function conceptAccess(database: Database, request: FastifyRequest, id: string) {
  const concept = found(database.db.select().from(concepts).where(scope(concepts, requireAuth(request).school.id, id)).get());
  chapterAccess(database.db, request, concept.chapterId);
  return concept;
}

export function prerequisiteGap(database: Database, schoolId: string, profileId: string, conceptId: string) {
  const candidates = database.sqlite.prepare(`WITH RECURSIVE prerequisites(id, depth, path) AS (
    SELECT ?, 0, ',' || ? || ','
    UNION ALL
    SELECT p.prereq_id, r.depth + 1, r.path || p.prereq_id || ','
    FROM concept_prereq p JOIN prerequisites r ON p.concept_id = r.id
    WHERE p.school_id = ? AND instr(r.path, ',' || p.prereq_id || ',') = 0
  ) SELECT c.id AS conceptId, max(r.depth) AS depth, coalesce(s.attempts, 0) AS evidence,
    coalesce(s.mastery, 0) AS mastery FROM prerequisites r
    JOIN concept c ON c.id = r.id AND c.school_id = ?
    LEFT JOIN student_concept_state s ON s.concept_id = c.id AND s.school_id = c.school_id AND s.profile_id = ?
    GROUP BY c.id`).all(conceptId, conceptId, schoolId, schoolId, profileId) as {
      conceptId: string; depth: number; evidence: number; mastery: number;
    }[];
  return selectPrerequisiteGap(conceptId, candidates);
}

export function remediationState(database: Database, request: FastifyRequest, conceptId: string, timestamp: number) {
  const { db, sqlite } = database;
  const { school, profile } = requireAuth(request);
  const root = conceptAccess(database, request, conceptId);
  const { failureId, checks, passed } = remediationProgress(db, school.id, profile.id, conceptId);
  // Keep the target fixed throughout an episode, including after its mastery changes.
  const gap = prerequisiteGap(database, school.id, profile.id, conceptId);
  const targetConceptId = checks[0]?.targetConceptId ?? gap.targetConceptId;
  const target = conceptAccess(database, request, targetConceptId);
  const view: Remediation = { conceptId, targetConceptId, title: target.title, status: !failureId ? 'not_needed' : passed ? 'passed' : 'needs_teacher_material',
    lesson: null, check: [], checkAttempts: checks.length, passedOnSecondAttempt: passed?.result.passedOnSecondAttempt ?? false, updatedAt: timestamp };
  const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
  const note = sqlite.prepare(`SELECT n.id, n.title, n.body FROM note n JOIN note_concept nc ON nc.note_id = n.id AND nc.school_id = n.school_id
      WHERE n.school_id = ? AND nc.concept_id = ? AND n.status = 'published' AND n.release_at <= ?
      AND length(trim(n.body)) > 0 ORDER BY n.id LIMIT 1`)
    .get(school.id, targetConceptId, timestamp) as { id: string; title: string; body: string } | undefined;
  // Query visibility explicitly: neither generated drafts nor another section's checks are eligible.
  const questionIds = note ? sqlite.prepare(`SELECT i.id FROM item i WHERE i.school_id = ? AND i.concept_id = ?
    AND json_extract(i.content, '$.sourceRef.noteId') = ? AND json_extract(i.content, '$.type') != 'short_answer'
    AND (EXISTS (SELECT 1 FROM learning_session s WHERE s.id = i.session_id AND s.school_id = i.school_id
      AND s.section_id = ? AND s.status = 'published' AND s.release_at <= ?)
      OR EXISTS (SELECT 1 FROM assignment_item ai JOIN assignment a ON a.id = ai.assignment_id AND a.school_id = ai.school_id
      WHERE ai.item_id = i.id AND ai.school_id = i.school_id AND a.section_id = ? AND a.status = 'published'))
    ORDER BY i.id LIMIT 2`).all(school.id, targetConceptId, note.id, enrolled.sectionId, timestamp, enrolled.sectionId) as { id: string }[] : [];
  const questions = questionIds.length ? db.select().from(items).where(and(eq(items.schoolId, school.id),
    inArray(items.id, questionIds.map((row) => row.id)))).orderBy(items.id).all() : [];
  if (failureId && !passed && note && questions.length === 2) {
    const body = note.body.slice(0, 1500);
    view.status = 'ready';
    view.lesson = { body, citation: { noteId: note.id, title: note.title, locator: 'Text opening', quote: body } };
    view.check = questions.map(publicItem);
  }
  return { root, target, failureId, checks, view, questions };
}
