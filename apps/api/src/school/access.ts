import type { Role } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import type { Db } from '../db/index.ts';
import { profiles, sections, subjects, teacherAssignments } from '../db/schema.ts';
import { ApiException } from '../errors.ts';

export function scope(table: { id: AnySQLiteColumn; schoolId: AnySQLiteColumn }, schoolId: string, id?: string) {
  return and(eq(table.schoolId, schoolId), id === undefined ? undefined : eq(table.id, id));
}

export function found<T>(row: T | undefined): T {
  if (row === undefined) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  return row;
}

export function mutate<T>(action: () => T): T {
  try {
    return action();
  } catch (error) {
    let cause: unknown = error;
    while (typeof cause === 'object' && cause !== null) {
      if ('code' in cause && typeof cause.code === 'string' && cause.code.startsWith('SQLITE_CONSTRAINT')) {
        throw new ApiException(409, 'RESOURCE_CONFLICT', 'This record already exists or is still in use.');
      }
      cause = 'cause' in cause ? cause.cause : null;
    }
    throw error;
  }
}

export function sectionSubject(db: Db, schoolId: string, sectionId: string, subjectId: string) {
  const section = found(db.select().from(sections).where(scope(sections, schoolId, sectionId)).get());
  const subject = found(db.select().from(subjects).where(scope(subjects, schoolId, subjectId)).get());
  if (section.classId !== subject.classId) {
    throw new ApiException(400, 'CLASS_MISMATCH', 'The subject must belong to the section’s class.');
  }
  return { sectionId, subjectId, classId: section.classId };
}

export function profileWithRole(db: Db, schoolId: string, profileId: string, role: Role) {
  return found(db.select().from(profiles).where(and(scope(profiles, schoolId, profileId), eq(profiles.role, role))).get());
}

export function readSection(db: Db, request: FastifyRequest, sectionId: string) {
  const identity = requireAuth(request);
  const section = found(db.select().from(sections).where(scope(sections, identity.school.id, sectionId)).get());
  if (identity.profile.role === 'admin') return section;
  if (identity.profile.role !== 'teacher') throw new ApiException(403, 'FORBIDDEN', 'Your role cannot access this resource.');
  found(db.select({ id: teacherAssignments.id }).from(teacherAssignments).where(and(
    eq(teacherAssignments.schoolId, identity.school.id), eq(teacherAssignments.teacherProfileId, identity.profile.id),
    eq(teacherAssignments.sectionId, sectionId),
  )).get());
  return section;
}
