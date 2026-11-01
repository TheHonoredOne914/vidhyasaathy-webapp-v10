import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AskQuickAnswerSchema, SaveItemSchema } from '@vidhyasaathy/contracts';
import { clampLevel } from '@vidhyasaathy/core/learning';
import { xpFromEvidence } from '@vidhyasaathy/core/xp';
import { recordAnswer, mistakeFor } from '../learning/record.ts';
import { AskPipeline } from '../ai/ask-pipeline.ts';
import type { LlmProvider } from '../ai/provider.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { Database } from '../db/index.ts';
import { ApiException, parseInput } from '../errors.ts';

const Id = z.object({ id: z.string().min(1).max(100) });
const List = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20), subjectId: z.string().optional() });

export function registerAskRoutes(app: FastifyInstance, database: Database, provider: LlmProvider, now: () => number, dailyLimit = 30_000, snapConfigured = false) {
  const pipeline = new AskPipeline(database, provider, now, dailyLimit);
  const { sqlite } = database;
  const maintenance = () => pipeline.purge();
  const timer = setInterval(maintenance, 60 * 60 * 1000);
  timer.unref();
  app.addHook('onClose', async () => { clearInterval(timer); });
  const student = { preHandler: requireRole('student') };
  const ownerMessage = (request: FastifyRequest, id: string) => {
    const { school, profile } = requireAuth(request);
    const row = sqlite.prepare(`SELECT m.*, t.title, c.subject_id FROM ask_message m JOIN ask_thread t ON t.id=m.thread_id
      LEFT JOIN chapter c ON c.id=t.chapter_id WHERE m.id=? AND t.school_id=? AND t.profile_id=? AND m.role='saathy'`)
      .get(id, school.id, profile.id) as { id: string; title: string; text: string; subject_id: string | null; thread_id: string } | undefined;
    if (!row) throw new ApiException(404, 'NOT_FOUND', 'This explanation is not available.');
    return row;
  };

  app.get('/ask/status', student, async (request) => {
    pipeline.purge();
    const { usedTokens, limitTokens } = pipeline.budget(request);
    return { configured: provider.configured, provider: provider.id, snapConfigured, budget: { usedTokens, limitTokens } };
  });

  app.post('/ask/stream', { ...student, config: { rateLimit: {
    max: 12, timeWindow: '1 minute', keyGenerator: (request: FastifyRequest) => `ask:${request.auth?.profile.id ?? request.ip}`,
  } } }, async (request, reply) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.raw.on('aborted', abort);
    reply.raw.on('close', abort);
    try {
      // Nothing leaves the server until the complete answer has passed output guards.
      const events = await pipeline.run(request, request.body, AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
      return reply.type('text/event-stream').header('cache-control', 'no-cache, no-store').header('x-accel-buffering', 'no')
        .send(events.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join(''));
    } finally {
      request.raw.off('aborted', abort);
      reply.raw.off('close', abort);
    }
  });

  app.get('/ask/threads', student, async (request) => {
    pipeline.purge();
    const { school, profile } = requireAuth(request);
    const { limit, subjectId } = parseInput(List, request.query);
    const rows = sqlite.prepare(`SELECT t.id,t.title,t.updated_at,s.name AS subject_name,co.title AS concept_name
      FROM ask_thread t LEFT JOIN chapter c ON c.id=t.chapter_id LEFT JOIN subject s ON s.id=c.subject_id
      LEFT JOIN concept co ON co.id=t.concept_id WHERE t.school_id=? AND t.profile_id=? AND (? IS NULL OR c.subject_id=?)
      ORDER BY t.updated_at DESC,t.id LIMIT ?`).all(school.id, profile.id, subjectId ?? null, subjectId ?? null, limit) as {
        id: string; title: string; updated_at: number; subject_name: string | null; concept_name: string | null;
      }[];
    return { threads: rows.map((row) => ({ id: row.id, title: row.title, subjectName: row.subject_name, conceptName: row.concept_name, updatedAt: new Date(row.updated_at).toISOString() })) };
  });

  const answerQuickTry = async (request: FastifyRequest) => {
    pipeline.purge();
    const input = parseInput(AskQuickAnswerSchema, request.body);
    const thread = pipeline.owner(request, input.threadId);
    const { school, profile } = requireAuth(request);
    return sqlite.transaction(() => {
      const row = sqlite.prepare('SELECT * FROM ask_quick_try WHERE thread_id=? AND created_at>=?').get(thread.id, now() - 86400000) as {
        item_id: string; concept_id: string; chapter_id: string; content: string; client_event_id: string | null; request: string | null; response: string | null;
      } | undefined;
      if (!row) throw new ApiException(404, 'NOT_FOUND', 'This quick try is no longer available.');
      const itemId = (request.params as { itemId?: string }).itemId;
      if (itemId && itemId !== row.item_id) throw new ApiException(404, 'NOT_FOUND', 'This quick try is not available.');
      const fingerprint = JSON.stringify(input);
      if (row.response) {
        if (row.client_event_id !== input.clientEventId || row.request !== fingerprint) throw new ApiException(409, 'ALREADY_ANSWERED', 'This quick try has already been answered.');
        return JSON.parse(row.response) as unknown;
      }
      const content = SaveItemSchema.parse(JSON.parse(row.content));
      if (content.type !== 'mcq' || !/^\d$/.test(input.optionId) || !content.options[Number(input.optionId)]) throw new ApiException(400, 'INVALID_ANSWER', 'Choose an offered answer.');
      const answer = content.options[Number(input.optionId)]!;
      const correct = answer === content.answer;
      recordAnswer(database.db, { id: `ask:${thread.id}`, schoolId: school.id, profileId: profile.id, conceptId: row.concept_id, chapterId: row.chapter_id, itemId: row.item_id,
        level: clampLevel(content.difficulty), source: 'ask', weight: 0.5, correct, confidence: input.confidence ?? 'unsure', timeMs: 0, answer, ...mistakeFor(content, answer) }, now());
      if (!correct) sqlite.prepare('INSERT INTO followup_item (id,school_id,profile_id,concept_id,item_id,reason,due_at,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(randomUUID(), school.id, profile.id, row.concept_id, row.item_id, 'quick_try', now() + 86400000, now());
      const response = { correct, correctOptionId: String(content.options.indexOf(content.answer)), explanation: content.explanation, evidenceSaved: true, xp: xpFromEvidence([{ kind: 'answer', correct, confidence: input.confidence ?? 'unsure' }]) };
      sqlite.prepare('UPDATE ask_quick_try SET client_event_id=?,request=?,response=? WHERE thread_id=?').run(input.clientEventId, fingerprint, JSON.stringify(response), thread.id);
      return response;
    })();
  };
  app.post('/ask/quick-try/answer', student, answerQuickTry);
  app.post('/ask/quick-try/:itemId/answer', student, answerQuickTry);

  app.get('/ask/threads/:id', student, async (request) => {
    pipeline.purge();
    const thread = pipeline.owner(request, parseInput(Id, request.params).id);
    const messages = pipeline.messages(thread.id);
    const replies = sqlite.prepare('SELECT id,teacher_reply AS text,replied_at AS createdAt FROM doubt_escalation WHERE school_id=? AND profile_id=? AND thread_id=? AND teacher_reply IS NOT NULL').all(requireAuth(request).school.id, requireAuth(request).profile.id, thread.id);
    return { id: thread.id, title: thread.title, style: thread.style, mode: thread.mode, concept: pipeline.concept(thread), purged: messages.length === 0, messages, teacherReplies: replies };
  });

  app.post('/ask/messages/:id/save', student, async (request) => {
    pipeline.purge();
    const message = ownerMessage(request, parseInput(Id, request.params).id);
    const { school, profile } = requireAuth(request);
    const savedId = randomUUID();
    sqlite.prepare('INSERT OR IGNORE INTO ask_saved (id,school_id,profile_id,message_id,title,subject_id,text,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(savedId, school.id, profile.id, message.id, message.title, message.subject_id, message.text, now());
    return { savedId: (sqlite.prepare('SELECT id FROM ask_saved WHERE profile_id=? AND message_id=?').get(profile.id, message.id) as { id: string }).id };
  });

  app.get('/ask/saved', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const { limit } = parseInput(List, request.query);
    const rows = sqlite.prepare(`SELECT a.*,s.name AS subject_name FROM ask_saved a LEFT JOIN subject s ON s.id=a.subject_id
      WHERE a.school_id=? AND a.profile_id=? ORDER BY a.created_at DESC,a.id LIMIT ?`).all(school.id, profile.id, limit) as {
        id: string; title: string; subject_name: string | null; created_at: number; message_id: string; text: string;
      }[];
    return { items: rows.map((row) => ({ id: row.id, title: row.title, subjectName: row.subject_name, savedAt: new Date(row.created_at).toISOString(), messageId: row.message_id, text: row.text })) };
  });

  app.delete('/ask/saved/:id', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const result = sqlite.prepare('DELETE FROM ask_saved WHERE id=? AND school_id=? AND profile_id=?').run(parseInput(Id, request.params).id, school.id, profile.id);
    if (!result.changes) throw new ApiException(404, 'NOT_FOUND', 'This saved explanation is not available.');
    return { ok: true };
  });
}
