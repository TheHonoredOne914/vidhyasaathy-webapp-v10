import { MIN_ANALYTICS_ATTEMPTS, type ClassInsights, type ConceptInsight, type EvidenceSummary, type Progress } from '@vidhyasaathy/contracts';
import { CONCEPT_PASS_THRESHOLD } from '@vidhyasaathy/core/remediation';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import { assignmentFilter, assignmentView } from '../assessment/service.ts';
import type { Db } from '../db/index.ts';
import { announcements, assignments, attempts, chapters, classes, classConceptDaily, concepts, doubts,
  learningEvidence, learningSessions, misconceptionDaily, parentLinks, profiles, reteachDecisions,
  sections, sessionProgress, studentConceptStates, subjects, teacherAssignments } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { found, scope } from '../school/access.ts';

export function summarizeEvidence(attempts: number, correct: number, pendingReview: number): EvidenceSummary {
  const enough = attempts >= MIN_ANALYTICS_ATTEMPTS;
  return {
    attempts, correct, pendingReview,
    passRate: enough ? correct / attempts : null,
    confidence: enough ? 'available' : 'insufficient',
    minAttempts: MIN_ANALYTICS_ATTEMPTS,
  };
}

export const forbidden = () => new ApiException(403, 'FORBIDDEN', 'This page is not available for your account.');

export function sectionAccess(db: Db, request: FastifyRequest, sectionId: string) {
  const { school, profile } = requireAuth(request);
  if (profile.role !== 'teacher' && profile.role !== 'admin') throw forbidden();
  const section = found(db.select().from(sections).where(scope(sections, school.id, sectionId)).get());
  const assigned = db.select().from(teacherAssignments).where(and(eq(teacherAssignments.schoolId, school.id),
    eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.sectionId, sectionId))).all();
  if (profile.role === 'teacher' && !assigned.length) throw forbidden();
  const subjectIds = profile.role === 'admin' ? null : new Set(assigned.map((row) => row.subjectId));
  return { section, subjectIds };
}

function sectionConcepts(db: Db, schoolId: string, classId: string, subjectIds: Set<string> | null = null) {
  return db.select({ concept: concepts, chapter: chapters }).from(concepts)
    .innerJoin(chapters, eq(chapters.id, concepts.chapterId)).innerJoin(subjects, eq(subjects.id, chapters.subjectId))
    .where(and(eq(concepts.schoolId, schoolId), eq(subjects.classId, classId))).all()
    .filter((row) => !subjectIds || subjectIds.has(row.chapter.subjectId));
}

export function classInsights(db: Db, request: FastifyRequest, sectionId: string, timestamp: number): ClassInsights {
  const { school } = requireAuth(request);
  const { section, subjectIds } = sectionAccess(db, request, sectionId);
  const visible = sectionConcepts(db, school.id, section.classId, subjectIds);
  const conceptIds = new Set(visible.map((row) => row.concept.id));
  const pupils = db.select().from(profiles).where(and(eq(profiles.schoolId, school.id),
    eq(profiles.sectionId, sectionId), eq(profiles.role, 'student'))).all();
  const pupilIds = new Set(pupils.map((row) => row.id));
  const totals = db.select().from(classConceptDaily).where(and(eq(classConceptDaily.schoolId, school.id),
    eq(classConceptDaily.sectionId, sectionId))).all();
  const states = db.select().from(studentConceptStates).where(eq(studentConceptStates.schoolId, school.id)).all()
    .filter((row) => pupilIds.has(row.profileId));
  const conceptViews: ConceptInsight[] = visible.map(({ concept, chapter }) => {
    const rows = totals.filter((row) => row.conceptId === concept.id);
    const evidence = summarizeEvidence(rows.reduce((sum, row) => sum + row.attempts, 0),
      rows.reduce((sum, row) => sum + row.correct, 0), rows.reduce((sum, row) => sum + row.pendingReview, 0));
    const learners = states.filter((row) => row.conceptId === concept.id);
    return { conceptId: concept.id, title: concept.title, subjectId: chapter.subjectId, ...evidence,
      students: learners.length, needingPractice: learners.filter((row) => row.attempts >= evidence.minAttempts
        && row.mastery < CONCEPT_PASS_THRESHOLD).length };
  });
  const wrong = db.select().from(misconceptionDaily).where(and(eq(misconceptionDaily.schoolId, school.id),
    eq(misconceptionDaily.sectionId, sectionId))).all().filter((row) => conceptIds.has(row.conceptId));
  const misconceptions = new Map<string, ClassInsights['misconceptions'][number]>();
  for (const row of wrong) {
    const key = JSON.stringify([row.itemId, row.option]);
    const existing = misconceptions.get(key);
    if (existing) existing.count += row.count;
    else misconceptions.set(key, { conceptId: row.conceptId, itemId: row.itemId, option: row.option, count: row.count });
  }
  const completed = db.select({ progress: sessionProgress, chapter: chapters }).from(sessionProgress)
    .innerJoin(learningSessions, eq(learningSessions.id, sessionProgress.sessionId))
    .innerJoin(chapters, eq(chapters.id, learningSessions.chapterId))
    .where(and(eq(sessionProgress.schoolId, school.id), eq(learningSessions.sectionId, sectionId), isNotNull(sessionProgress.completedAt))).all()
    .filter((row) => pupilIds.has(row.progress.profileId) && (!subjectIds || subjectIds.has(row.chapter.subjectId)));
  const batches = db.select({ chapterId: doubts.chapterId }).from(doubts).innerJoin(profiles, eq(profiles.id, doubts.profileId))
    .where(and(eq(doubts.schoolId, school.id), eq(profiles.sectionId, sectionId))).all();
  const chapterViews = new Map(visible.map(({ chapter }) => [chapter.id, chapter]));
  const decisions = db.select().from(reteachDecisions).where(and(eq(reteachDecisions.schoolId, school.id),
    eq(reteachDecisions.sectionId, sectionId))).orderBy(desc(reteachDecisions.createdAt)).all()
    .filter((row) => conceptIds.has(row.conceptId)).map(({ schoolId: _schoolId, ...row }) => row);
  return { sectionId, updatedAt: timestamp, students: pupils.length, completedSessions: completed.length,
    concepts: conceptViews, misconceptions: [...misconceptions.values()], decisions,
    doubtBatches: [...chapterViews.values()].map((chapter) => ({ chapterId: chapter.id, title: chapter.title,
      count: batches.filter((row) => row.chapterId === chapter.id).length })).filter((row) => row.count > 0) };
}

export function studentProgress(db: Db, request: FastifyRequest, student: typeof profiles.$inferSelect, timestamp: number): Progress {
  const section = student.sectionId ? db.select().from(sections).where(scope(sections, student.schoolId, student.sectionId)).get() : null;
  const visible = section ? sectionConcepts(db, student.schoolId, section.classId) : [];
  const raw = db.select().from(attempts).where(and(eq(attempts.schoolId, student.schoolId), eq(attempts.profileId, student.id))).all();
  const learning = db.select().from(learningEvidence).where(and(eq(learningEvidence.schoolId, student.schoolId), eq(learningEvidence.profileId, student.id))).all();
  const states = db.select().from(studentConceptStates).where(and(eq(studentConceptStates.schoolId, student.schoolId), eq(studentConceptStates.profileId, student.id))).all();
  const conceptViews = visible.map(({ concept, chapter }): ConceptInsight => {
    const rows = [...raw, ...learning].filter((row) => row.conceptId === concept.id);
    const evidence = summarizeEvidence(rows.filter((row) => row.correct !== null).length,
      rows.filter((row) => row.correct === true).length, rows.filter((row) => row.correct === null).length);
    const state = states.find((row) => row.conceptId === concept.id);
    return { conceptId: concept.id, title: concept.title, subjectId: chapter.subjectId, ...evidence,
      students: evidence.attempts ? 1 : 0, needingPractice: state && evidence.confidence === 'available'
        && state.mastery < CONCEPT_PASS_THRESHOLD ? 1 : 0 };
  });
  const completed = db.select().from(sessionProgress).where(and(eq(sessionProgress.schoolId, student.schoolId),
    eq(sessionProgress.profileId, student.id), isNotNull(sessionProgress.completedAt))).all();
  const work = db.select().from(assignments).where(and(eq(assignments.schoolId, student.schoolId),
    eq(assignments.sectionId, student.sectionId ?? ''), eq(assignments.status, 'published'))).orderBy(desc(assignments.dueAt)).all();
  return { profileId: student.id, updatedAt: timestamp,
    evidence: summarizeEvidence(conceptViews.reduce((sum, row) => sum + row.attempts, 0),
      conceptViews.reduce((sum, row) => sum + row.correct, 0), conceptViews.reduce((sum, row) => sum + row.pendingReview, 0)),
    completedSessions: completed.length, concepts: conceptViews, assignments: work.map((row) => assignmentView(db, request, row, student.id)) };
}

export function teacherDashboard(db: Db, request: FastifyRequest, sectionId: string | undefined, timestamp: number) {
  const { school, profile } = requireAuth(request);
  if (sectionId) sectionAccess(db, request, sectionId);
  const assigned = db.select().from(teacherAssignments).where(and(eq(teacherAssignments.schoolId, school.id),
    eq(teacherAssignments.teacherProfileId, profile.id))).all().filter((row) => !sectionId || row.sectionId === sectionId);
  const ids = [...new Set(assigned.map((row) => row.sectionId))];
  const work = db.select({ assignment: assignments }).from(assignments).innerJoin(chapters, eq(chapters.id, assignments.chapterId))
    .where(assignmentFilter(db, request)).all().filter(({ assignment }) => ids.includes(assignment.sectionId));
  const workIds = new Set(work.map(({ assignment }) => assignment.id));
  const queue = db.select().from(attempts).where(and(eq(attempts.schoolId, school.id), eq(attempts.needsReview, true))).all()
    .filter((row) => row.assignmentId !== null && workIds.has(row.assignmentId));
  const sessions = db.select({ session: learningSessions, subjectId: chapters.subjectId }).from(learningSessions)
    .innerJoin(chapters, eq(chapters.id, learningSessions.chapterId)).where(eq(learningSessions.schoolId, school.id)).all()
    .filter(({ session, subjectId }) => session.status === 'published' && session.releaseAt !== null
      && session.releaseAt <= timestamp && session.releaseAt >= Math.floor(timestamp / 86400000) * 86400000
      && assigned.some((row) => row.sectionId === session.sectionId && row.subjectId === subjectId))
    .map(({ session }) => ({ id: session.id, title: session.title, chapterId: session.chapterId, releaseAt: session.releaseAt }));
  return { updatedAt: timestamp, classes: ids.map((id) => classInsights(db, request, id, timestamp)),
    reviewQueue: queue.length, assignments: work.map(({ assignment }) => assignmentView(db, request, assignment)), sessions };
}

export function visibleAnnouncements(db: Db, request: FastifyRequest, sectionId?: string) {
  const { school, profile } = requireAuth(request);
  let sectionIds: Set<string>;
  if (profile.role === 'admin') sectionIds = new Set(db.select().from(sections).where(eq(sections.schoolId, school.id)).all().map((row) => row.id));
  else if (profile.role === 'teacher') sectionIds = new Set(db.select().from(teacherAssignments).where(and(
    eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id))).all().map((row) => row.sectionId));
  else if (profile.role === 'parent') sectionIds = new Set(db.select({ sectionId: profiles.sectionId }).from(parentLinks)
    .innerJoin(profiles, eq(profiles.id, parentLinks.studentProfileId)).where(and(eq(parentLinks.schoolId, school.id),
      eq(parentLinks.parentProfileId, profile.id))).all().flatMap((row) => row.sectionId ? [row.sectionId] : []));
  else {
    const student = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
    sectionIds = new Set(student.sectionId ? [student.sectionId] : []);
  }
  if (sectionId && !sectionIds.has(sectionId)) throw forbidden();
  return db.select().from(announcements).where(and(eq(announcements.schoolId, school.id),
    sectionId ? eq(announcements.sectionId, sectionId) : undefined)).orderBy(desc(announcements.createdAt)).all()
    .filter((row) => sectionIds.has(row.sectionId) && (profile.role === 'admin' || profile.role === 'teacher'
      || row.audience === 'all' || row.audience === (profile.role === 'parent' ? 'parents' : 'students')))
    .map(({ schoolId: _schoolId, ...row }) => row);
}

export function parentSummary(db: Db, request: FastifyRequest, studentId: string, timestamp: number) {
  const { school, profile } = requireAuth(request);
  const link = db.select().from(parentLinks).where(and(eq(parentLinks.schoolId, school.id),
    eq(parentLinks.parentProfileId, profile.id), eq(parentLinks.studentProfileId, studentId))).get();
  if (!link) throw forbidden();
  const child = found(db.select().from(profiles).where(and(scope(profiles, school.id, studentId), eq(profiles.role, 'student'))).get());
  const section = child.sectionId ? db.select().from(sections).where(scope(sections, school.id, child.sectionId)).get() : null;
  const classroom = section ? db.select().from(classes).where(scope(classes, school.id, section.classId)).get() : null;
  const progress = studentProgress(db, request, child, timestamp);
  const focus = progress.concepts.filter((row) => row.needingPractice > 0).map(({ conceptId, title }) => ({ conceptId, title }));
  const latest = db.select().from(attempts).where(and(eq(attempts.schoolId, school.id), eq(attempts.profileId, studentId)))
    .orderBy(desc(attempts.serverTs), desc(attempts.id)).get();
  const latestLearning = db.select().from(learningEvidence).where(and(eq(learningEvidence.schoolId, school.id), eq(learningEvidence.profileId, studentId)))
    .orderBy(desc(learningEvidence.createdAt), desc(learningEvidence.id)).get();
  const decision = child.sectionId ? db.select().from(reteachDecisions).where(and(eq(reteachDecisions.schoolId, school.id),
    eq(reteachDecisions.sectionId, child.sectionId))).orderBy(desc(reteachDecisions.createdAt)).all()
    .find((row) => progress.concepts.some((concept) => concept.conceptId === row.conceptId)) : null;
  return { updatedAt: timestamp, child: { id: child.id, name: child.name, className: classroom?.name ?? null,
    sectionName: section?.name ?? null, schoolName: school.name }, progress, currentFocus: focus,
    latestResult: latestLearning && (!latest || latestLearning.createdAt > latest.serverTs)
      ? { correct: latestLearning.correct, recordedAt: latestLearning.createdAt }
      : latest ? { correct: latest.correct, recordedAt: latest.serverTs } : null,
    observedResult: { status: 'available', text: `${progress.evidence.correct} correct from ${progress.evidence.attempts} marked checks; ${progress.evidence.pendingReview} awaiting review.` },
    aiInterpretation: { status: 'not_configured', text: 'AI interpretation is not configured. This summary uses recorded learning evidence only.' },
    teacherConfirmed: decision ? { status: 'available', text: `${decision.decision}: ${decision.note}` }
      : { status: 'not_confirmed', text: 'No teacher confirmation has been recorded.' },
    suggestedAction: { status: 'available', text: focus[0] ? `Help your child review the teacher material for ${focus[0].title}.`
      : progress.evidence.confidence === 'insufficient' ? 'Encourage your child to complete the assigned checks so there is enough evidence.' : 'Encourage your child to continue the assigned practice.' },
    teacherUpdates: child.sectionId ? visibleAnnouncements(db, request, child.sectionId) : [] };
}
