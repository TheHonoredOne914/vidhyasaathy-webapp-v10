import type { PublicItem } from '@vidhyasaathy/contracts';
import { sessionProgress as progressFor } from '@vidhyasaathy/core/session';
import { and, eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import type { Db } from '../db/index.ts';
import { items, learningSessions, profiles, sessionProgress, slides, teacherAssignments } from '../db/schema.ts';
import { found, scope } from '../school/access.ts';
import { chapterAccess, isAvailable, requireAvailable } from './access.ts';

export function learningSessionAccess(db: Db, request: FastifyRequest, id: string, now: number, write = false) {
  const session = found(db.select().from(learningSessions).where(scope(learningSessions, requireAuth(request).school.id, id)).get());
  chapterAccess(db, request, session.chapterId, write, session.sectionId);
  if (requireAuth(request).profile.role === 'student') {
    requireAvailable(session, now);
    // A session without slides is not playable yet; students must not reach it.
    if (!hasSlides(db, session.id)) found(undefined);
  }
  return session;
}

export function hasSlides(db: Db, sessionId: string) {
  return db.select({ id: slides.id }).from(slides).where(eq(slides.sessionId, sessionId)).limit(1).get() !== undefined;
}

export function sessionSlides(db: Db, sessionId: string) {
  return db.select({ id: slides.id, position: slides.position, conceptId: slides.conceptId, title: slides.title, body: slides.body, noteId: slides.noteId })
    .from(slides).where(eq(slides.sessionId, sessionId)).orderBy(slides.position).all();
}

export function sessionItems(db: Db, sessionId: string) {
  return db.select({ id: items.id, position: items.position, sessionId: items.sessionId, content: items.content })
    .from(items).where(eq(items.sessionId, sessionId)).orderBy(items.position).all();
}

export function progressRow(db: Db, sessionId: string, profileId: string) {
  return db.select().from(sessionProgress).where(and(eq(sessionProgress.sessionId, sessionId), eq(sessionProgress.profileId, profileId))).get();
}

export function publicItem(row: ReturnType<typeof sessionItems>[number]): PublicItem {
  const { conceptId, prompt, difficulty, sourceRef } = row.content;
  const base = { id: row.id, position: row.position, conceptId, prompt, difficulty, sourceRef };
  switch (row.content.type) {
    case 'mcq': return { ...base, type: 'mcq', options: row.content.options };
    case 'match_pairs': return {
      ...base, type: 'match_pairs', left: row.content.pairs.map((pair) => pair.left),
      right: row.content.pairs.map((pair) => pair.right).sort(),
    };
    case 'short_answer': return { ...base, type: 'short_answer' };
    case 'flashcard': return { ...base, type: 'flashcard' };
  }
}

export function sessionView(db: Db, request: FastifyRequest, session: typeof learningSessions.$inferSelect) {
  const allSlides = sessionSlides(db, session.id);
  const check = sessionItems(db, session.id);
  if (requireAuth(request).profile.role !== 'student') return { ...session, slides: allSlides, check, progress: null };
  if (!allSlides.length) return { ...session, slides: [], check: [], progress: null };
  const row = progressRow(db, session.id, requireAuth(request).profile.id);
  const progress = progressFor(allSlides.length, row?.viewedSlides ?? 0, row?.completedAt != null);
  const review = parseReview(row?.lastReview);
  return {
    ...session, progress, ...(review ? { review } : {}),
    slides: allSlides.slice(0, Math.min(progress.viewedSlides + 1, allSlides.length)),
    check: progress.checkAvailable ? check.map(publicItem) : [],
  };
}

function parseReview(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function visibleSessions(db: Db, request: FastifyRequest, chapterId: string, now: number) {
  const chapter = chapterAccess(db, request, chapterId);
  const { profile, school } = requireAuth(request);
  const all = db.select().from(learningSessions).where(and(eq(learningSessions.schoolId, school.id), eq(learningSessions.chapterId, chapterId))).all();
  if (profile.role === 'admin') return all;
  if (profile.role === 'teacher') {
    const assignments = db.select().from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id), eq(teacherAssignments.subjectId, chapter.subjectId),
    )).all();
    return all.filter((session) => assignments.some((assignment) => assignment.sectionId === session.sectionId));
  }
  const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
  return all.filter((session) => session.sectionId === enrolled.sectionId && isAvailable(session, now) && hasSlides(db, session.id));
}

export function chapterStatus(db: Db, request: FastifyRequest, chapterId: string, now: number) {
  if (requireAuth(request).profile.role !== 'student') return 'not_started' as const;
  const all = visibleSessions(db, request, chapterId, now);
  const progress = all.map((session) => progressRow(db, session.id, requireAuth(request).profile.id));
  if (all.length && progress.every((row) => row?.completedAt != null)) return 'completed' as const;
  return progress.some((row) => (row?.viewedSlides ?? 0) > 0) ? 'in_progress' as const : 'not_started' as const;
}
