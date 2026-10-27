import { ResourceParamsSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import type { Db } from '../db/index.ts';
import { chapters, profiles, sections, subjects, teacherAssignments } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, scope } from '../school/access.ts';

export function resourceId(request: FastifyRequest) {
  return parseInput(ResourceParamsSchema, request.params).id;
}

export function subjectAccess(db: Db, request: FastifyRequest, subjectId: string, write = false, sectionId?: string) {
  const { profile, school } = requireAuth(request);
  const subject = found(db.select().from(subjects).where(scope(subjects, school.id, subjectId)).get());
  if (sectionId) {
    const section = found(db.select().from(sections).where(scope(sections, school.id, sectionId)).get());
    if (section.classId !== subject.classId) throw new ApiException(400, 'CLASS_MISMATCH', 'Choose a section in this subject’s class.');
  }
  if (profile.role === 'admin') return subject;
  if (profile.role === 'teacher') {
    const assignment = db.select().from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.subjectId, subjectId),
      eq(teacherAssignments.teacherProfileId, profile.id),
      sectionId ? eq(teacherAssignments.sectionId, sectionId) : undefined,
    )).get();
    if (assignment) return subject;
  }
  if (profile.role === 'student' && !write) {
    const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
    const section = enrolled.sectionId
      ? db.select().from(sections).where(scope(sections, school.id, enrolled.sectionId)).get() : undefined;
    if (section?.classId === subject.classId && (!sectionId || section.id === sectionId)) return subject;
  }
  throw new ApiException(403, 'FORBIDDEN', 'This content is not available for your account.');
}

export function chapterAccess(db: Db, request: FastifyRequest, id: string, write = false, sectionId?: string) {
  const chapter = found(db.select().from(chapters).where(scope(chapters, requireAuth(request).school.id, id)).get());
  subjectAccess(db, request, chapter.subjectId, write, sectionId);
  return chapter;
}

export function isAvailable(row: { status: string; releaseAt: number | null }, now: number) {
  return row.status === 'published' && row.releaseAt !== null && row.releaseAt <= now;
}

export function requireAvailable(row: { status: string; releaseAt: number | null }, now: number) {
  if (!isAvailable(row, now)) throw new ApiException(403, 'CONTENT_UNAVAILABLE', 'This content has not been released yet.');
}

export function requireDraft(row: { status: string }) {
  if (row.status !== 'draft') throw new ApiException(409, 'CONTENT_PUBLISHED', 'Published content cannot be changed. Create a new draft.');
}
