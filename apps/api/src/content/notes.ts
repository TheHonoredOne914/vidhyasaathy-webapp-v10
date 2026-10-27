import { and, eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import type { Db } from '../db/index.ts';
import { notes, noteConcepts } from '../db/schema.ts';
import { found, scope } from '../school/access.ts';
import { chapterAccess, requireAvailable } from './access.ts';

export function noteAccess(db: Db, request: FastifyRequest, id: string, now: number, write = false) {
  const note = found(db.select().from(notes).where(scope(notes, requireAuth(request).school.id, id)).get());
  chapterAccess(db, request, note.chapterId, write);
  if (requireAuth(request).profile.role === 'student') requireAvailable(note, now);
  return note;
}

export function noteView(db: Db, note: typeof notes.$inferSelect) {
  const { id, schoolId, chapterId, title, body, status, releaseAt, updatedAt, filename, contentType, fileSize, type, startSec, endSec } = note;
  return {
    id, schoolId, chapterId, title, body, status, releaseAt, updatedAt,
    conceptIds: db.select({ conceptId: noteConcepts.conceptId }).from(noteConcepts).where(and(
      eq(noteConcepts.schoolId, note.schoolId), eq(noteConcepts.noteId, note.id),
    )).all().map((row) => row.conceptId),
    file: filename && contentType && fileSize ? { filename, contentType, size: fileSize } : null,
    type, startSec, endSec,
  };
}
