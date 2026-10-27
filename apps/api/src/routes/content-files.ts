import { randomUUID } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { MAX_UPLOAD_BYTES, UploadFileSchema } from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import { requireDraft, resourceId } from '../content/access.ts';
import { noteAccess, noteView } from '../content/notes.ts';
import type { Db } from '../db/index.ts';
import { notes } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found } from '../school/access.ts';

function readUpload(body: unknown) {
  const encoded = typeof body === 'object' && body !== null && 'dataBase64' in body && typeof body.dataBase64 === 'string'
    ? body.dataBase64 : null;
  // ponytail: the contract regex overflows the stack near 10 MiB, so size is rejected before schema parse.
  if (encoded && encoded.length % 4 === 0) {
    const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
    if ((encoded.length / 4) * 3 - padding > MAX_UPLOAD_BYTES) {
      throw new ApiException(413, 'FILE_TOO_LARGE', 'Files must be 10 MiB or smaller.');
    }
  }
  if (!encoded || encoded.length < 262144 || typeof body !== 'object' || body === null) return parseInput(UploadFileSchema, body);
  return { ...parseInput(UploadFileSchema, { ...body, dataBase64: 'bm90ZQ==' }), dataBase64: encoded };
}

function checkFile(data: Buffer, type: string, filename: string) {
  if (data.length > MAX_UPLOAD_BYTES) throw new ApiException(413, 'FILE_TOO_LARGE', 'Files must be 10 MiB or smaller.');
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const matches = type === 'application/pdf' ? extension === '.pdf' && data.subarray(0, 5).toString() === '%PDF-'
    : type === 'image/png' ? extension === '.png' && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
      : type === 'image/jpeg' ? ['.jpg', '.jpeg'].includes(extension) && data.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
        : extension === '.txt' && data.length > 0 && !data.includes(0) && isUtf8(data);
  if (!matches) throw new ApiException(400, 'FILE_TYPE_MISMATCH', 'The file must match its PDF, PNG, JPEG or UTF-8 text type.');
}

export function registerContentFileRoutes(app: FastifyInstance, db: Db, auth: AuthService, directory: string, now: () => number) {
  app.post('/notes/:id/file', {
    preHandler: requireRole('admin', 'teacher'), bodyLimit: 4 * Math.ceil(MAX_UPLOAD_BYTES / 3) + 4096,
  }, async (request) => {
    const note = noteAccess(db, request, resourceId(request), now(), true);
    requireDraft(note);
    if (note.fileKey) throw new ApiException(409, 'FILE_EXISTS', 'Create a new note to replace this file.');
    const input = readUpload(request.body);
    const data = Buffer.from(input.dataBase64, 'base64');
    if (data.toString('base64') !== input.dataBase64) throw new ApiException(400, 'INVALID_FILE', 'Use canonical base64 file data.');
    checkFile(data, input.contentType, input.filename);
    const key = randomUUID();
    const path = resolve(directory, key);
    await mkdir(directory, { recursive: true });
    await writeFile(path, data, { flag: 'wx', mode: 0o600 });
    try {
      return db.transaction(() => {
        const current = noteAccess(db, request, note.id, now(), true);
        requireDraft(current);
        if (current.fileKey) throw new ApiException(409, 'FILE_EXISTS', 'This note already has a file.');
        const row = found(db.update(notes).set({
          fileKey: key, filename: input.filename, contentType: input.contentType, fileSize: data.length, updatedAt: now(),
        }).where(eq(notes.id, note.id)).returning().get());
        auth.audit(request, 'content.file.upload');
        return noteView(db, row);
      });
    } catch (error) {
      await unlink(path);
      throw error;
    }
  });
  app.get('/notes/:id/file', { preHandler: requireRole('admin', 'teacher', 'student') }, async (request, reply) => {
    const note = noteAccess(db, request, resourceId(request), now());
    if (!note.fileKey || !/^[a-f0-9-]{36}$/.test(note.fileKey)) throw new ApiException(404, 'NOT_FOUND', 'File not found.');
    let data: Buffer;
    try { data = await readFile(resolve(directory, note.fileKey)); } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
        throw new ApiException(404, 'NOT_FOUND', 'File not found.');
      }
      throw error;
    }
    return reply.type(note.contentType ?? 'application/octet-stream')
      .header('X-Content-Type-Options', 'nosniff').header('Content-Security-Policy', "default-src 'none'; sandbox")
      .header('Content-Disposition', `attachment; filename="note"; filename*=UTF-8''${encodeURIComponent(note.filename ?? 'note')}`)
      .send(data);
  });
}
