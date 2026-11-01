import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RETENTION_MS } from '../ai/ask-pipeline.ts';
import type { VisionProvider } from '../ai/provider.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { Database } from '../db/index.ts';
import { ApiException, parseInput } from '../errors.ts';

const LIMIT = 4 * 1024 * 1024;
export function registerAskSnapRoutes(app: FastifyInstance, database: Database, vision: VisionProvider, now: () => number, directory = resolve(import.meta.dirname, '../../data/private/snap')) {
  const root = resolve(directory);
  const { sqlite } = database;
  const cleanup = async () => {
    const expired = sqlite.prepare('SELECT id,path FROM snap_upload WHERE created_at<?').all(now() - RETENTION_MS) as { id: string; path: string }[];
    for (const row of expired) {
      if (resolve(row.path).startsWith(root + sep)) await unlink(row.path).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
      sqlite.prepare('DELETE FROM snap_upload WHERE id=?').run(row.id);
    }
  };
  const timer = setInterval(() => { void cleanup().catch(() => undefined); }, 60 * 60 * 1000);
  timer.unref();
  app.addHook('onClose', async () => { clearInterval(timer); });
  app.register(async (scope) => {
    scope.addContentTypeParser(/^multipart\/form-data(?:;|$)/, { parseAs: 'buffer', bodyLimit: LIMIT + 8192 }, (_request, body, done) => done(null, body));
    scope.post('/ask/snap', { preHandler: requireRole('student'), bodyLimit: LIMIT + 8192 }, async (request) => {
      await cleanup();
      const type = request.headers['content-type'] ?? '';
      const boundary = /boundary=(?:"([^"\r\n]+)"|([^;\s]+))/i.exec(type);
      if (!boundary || !Buffer.isBuffer(request.body)) throw new ApiException(400, 'INVALID_INPUT', 'Choose a JPEG, PNG or WebP image.');
      const marker = Buffer.from(`--${boundary[1] ?? boundary[2]}`);
      const body = request.body;
      const headerEnd = body.indexOf('\r\n\r\n');
      const end = body.indexOf(Buffer.concat([Buffer.from('\r\n'), marker]), headerEnd + 4);
      if (headerEnd < 0 || headerEnd > 4096 || end < 0 || !body.subarray(0, marker.length).equals(marker)) throw new ApiException(400, 'INVALID_INPUT', 'Upload one image at a time.');
      const headers = body.subarray(marker.length, headerEnd).toString('utf8');
      const mime = /content-type:\s*(image\/(?:jpeg|png|webp))\s*\r?$/im.exec(headers)?.[1];
      const bytes = body.subarray(headerEnd + 4, end);
      const trailing = body.subarray(end + 2 + marker.length).toString('utf8');
      const matches = mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
        : mime === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
          : mime === 'image/webp' && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
      if (!matches || !trailing.startsWith('--') || bytes.length > LIMIT) throw new ApiException(bytes.length > LIMIT ? 413 : 400, 'INVALID_IMAGE', 'Choose one JPEG, PNG or WebP image, up to 4 MB.');
      const { school, profile } = requireAuth(request);
      const snapId = randomUUID(), path = resolve(root, snapId);
      await mkdir(root, { recursive: true });
      await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
      let result: Awaited<ReturnType<VisionProvider['extractText']>>;
      try { result = await vision.extractText(new File([new Uint8Array(bytes)], 'question', { type: mime ?? 'application/octet-stream' })); }
      catch { result = { status: 'failed' }; }
      sqlite.prepare('INSERT INTO snap_upload (id,school_id,profile_id,path,status,text,created_at) VALUES (?,?,?,?,?,?,?)')
        .run(snapId, school.id, profile.id, path, result.status, result.text?.slice(0, 800) ?? null, now());
      return { snapId, status: result.status, ...(result.status === 'extracted' ? { extractedText: result.text } : { message: result.status === 'not_configured' ? 'Photo reading is not set up yet. Please type your question.' : 'I could not read this image. Please type your question.' }) };
    });
  });
  app.post('/ask/snap/:id/confirm', { preHandler: requireRole('student') }, async (request) => {
    await cleanup();
    const { school, profile } = requireAuth(request);
    const { id } = parseInput(z.object({ id: z.string().max(100) }), request.params);
    const { text } = parseInput(z.object({ text: z.string().trim().min(1).max(800) }).strict(), request.body);
    const changed = sqlite.prepare("UPDATE snap_upload SET text=?,confirmed=1 WHERE id=? AND school_id=? AND profile_id=? AND status='extracted'").run(text, id, school.id, profile.id);
    if (!changed.changes) throw new ApiException(404, 'NOT_FOUND', 'This photo is not available.');
    return { snapId: id, text };
  });
}
