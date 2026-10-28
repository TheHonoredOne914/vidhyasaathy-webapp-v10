import { randomUUID } from 'node:crypto';
import { AskSchema, CreateDraftJobSchema, ReviewDraftJobSchema, type AskResponse } from '@vidhyasaathy/contracts';
import { and, eq, lte } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { extractAnswer } from '../ai/extract.ts';
import { approveDraft, draftJobView, draftSource, runDraftJob } from '../ai/jobs.ts';
import { ProviderAnswerSchema, type LlmProvider } from '../ai/provider.ts';
import { digest, retrieveNotes } from '../ai/retrieval.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import { chapterAccess, resourceId } from '../content/access.ts';
import { noteAccess } from '../content/notes.ts';
import type { Database } from '../db/index.ts';
import { aiCache, aiDraftJobs, doubts } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, scope } from '../school/access.ts';

export function registerAiRoutes(app: FastifyInstance, database: Database, auth: AuthService, provider: LlmProvider, now: () => number, pollMs: number) {
  const { db } = database;
  const rateLimit = { max: 10, timeWindow: 60000, keyGenerator: (request: FastifyRequest) => `ai:${request.auth?.profile.id ?? request.ip}` };
  const staff = { preHandler: requireRole('admin', 'teacher'), config: { rateLimit } };
  const cleanup = () => {
    db.delete(aiCache).where(lte(aiCache.expiresAt, now())).run();
    db.delete(doubts).where(lte(doubts.createdAt, now() - 86400000)).run();
  };
  app.post('/ask', { preHandler: requireRole('student'), config: { rateLimit } }, async (request) => {
    const input = parseInput(AskSchema, request.body);
    const { school, profile } = requireAuth(request);
    chapterAccess(db, request, input.chapterId);
    cleanup();
    const question = input.question.toLowerCase().replace(/\s+/g, ' ');
    const sources = retrieveNotes(database, school.id, input.chapterId, question, now());
    let response: AskResponse = {
      status: 'not_in_notes', message: 'This is not in your notes. Ask your teacher for help.',
      hintLevel: input.hintLevel, socratic: input.socratic, citations: [], cached: false, updatedAt: now(),
    };
    const requirePreviousHint = () => {
      if (input.hintLevel <= 1) return;
      const earlier = db.select().from(doubts).where(and(eq(doubts.schoolId, school.id), eq(doubts.profileId, profile.id),
        eq(doubts.chapterId, input.chapterId), eq(doubts.question, question))).all();
      if (!earlier.some((entry) => entry.response.status === 'answered' && entry.response.hintLevel >= input.hintLevel - 1
        && entry.response.socratic === input.socratic)) {
        throw new ApiException(409, 'HINT_FIRST', 'Try the previous hint first.');
      }
    };
    if (sources.length && !provider.configured) {
      // Without a provider, quote the released notes directly; questions they do not cover stay unanswered.
      const extracted = extractAnswer(question, sources, input.hintLevel, input.socratic);
      if (extracted) {
        requirePreviousHint();
        response = { ...response, status: 'answered', message: extracted.message, updatedAt: now(),
          citations: extracted.quotes.map(({ source, quote }) => ({ noteId: source.noteId, title: source.title, locator: `Text chunk ${source.position + 1}`, quote })) };
      }
    }
    if (sources.length && provider.configured) {
      requirePreviousHint();
      const key = digest({ schoolId: school.id, profileId: profile.id, chapterId: input.chapterId, question, sources, provider: provider.id,
        hintLevel: input.hintLevel, socratic: input.socratic });
      const cached = db.select().from(aiCache).where(eq(aiCache.key, key)).get();
      if (cached) response = { ...cached.response, cached: true };
      else {
        try {
          const answer = await provider.ask({ ...input, sources });
          if (answer) {
            const valid = ProviderAnswerSchema.parse(answer);
            const citations = valid.sources.map((citation) => {
              const source = sources.find((entry) => entry.id === citation.chunkId);
              if (!source || !source.text.includes(citation.quote)) throw new Error('Ungrounded citation.');
              return { noteId: source.noteId, title: source.title, locator: `Text chunk ${source.position + 1}`, quote: citation.quote };
            });
            if (digest(retrieveNotes(database, school.id, input.chapterId, question, now())) !== digest(sources)) throw new Error('Sources changed.');
            response = { ...response, status: 'answered', message: valid.message, citations, updatedAt: now() };
          }
          db.insert(aiCache).values({ key, response, expiresAt: now() + 3600000 }).onConflictDoNothing().run();
        } catch {
          response = { ...response, status: 'unavailable', message: 'Saathy could not verify an answer from your notes. Try again or ask your teacher.', updatedAt: now() };
        }
      }
    }
    db.insert(doubts).values({ id: randomUUID(), schoolId: school.id, profileId: profile.id, chapterId: input.chapterId, question, response, createdAt: now() }).run();
    return response;
  });
  app.post('/ai/draft-jobs', staff, async (request, reply) => {
    const input = parseInput(CreateDraftJobSchema, request.body);
    const note = noteAccess(db, request, input.noteId, now(), true);
    chapterAccess(db, request, note.chapterId, true, input.sectionId);
    const source = draftSource(db, note);
    if (!source.concepts.length) throw new ApiException(400, 'CONCEPT_REQUIRED', 'Tag at least one concept before drafting.');
    const job = db.transaction(() => {
      const row = db.insert(aiDraftJobs).values({
        id: randomUUID(), schoolId: note.schoolId, chapterId: note.chapterId, noteId: note.id, sectionId: input.sectionId,
        requestedBy: requireAuth(request).profile.id, sourceHash: digest(source), status: 'queued', createdAt: now(), updatedAt: now(),
      }).returning().get()!;
      auth.audit(request, 'ai.draft.create');
      return row;
    });
    return reply.code(202).send(draftJobView(job));
  });
  function accessJob(request: FastifyRequest) {
    const job = found(db.select().from(aiDraftJobs).where(scope(aiDraftJobs, requireAuth(request).school.id, resourceId(request))).get());
    chapterAccess(db, request, job.chapterId, true, job.sectionId);
    return job;
  }
  app.get('/ai/draft-jobs/:id', { preHandler: staff.preHandler }, async (request) => draftJobView(accessJob(request)));
  app.post('/ai/draft-jobs/:id/review', staff, async (request) => {
    const input = parseInput(ReviewDraftJobSchema, request.body);
    return db.transaction(() => {
      const job = accessJob(request);
      if (job.status !== 'ready') throw new ApiException(409, 'DRAFT_NOT_READY', 'Only a ready draft can be reviewed.');
      const row = input.decision === 'reject'
        ? db.update(aiDraftJobs).set({ status: 'rejected', updatedAt: now() }).where(eq(aiDraftJobs.id, job.id)).returning().get()!
        : approveDraft(db, job, input.draft, requireAuth(request).profile.id, input.dueAt, now());
      auth.audit(request, `ai.draft.${input.decision}`);
      return draftJobView(row);
    });
  });

  // Single local API process owns the queue; interrupted jobs are safe to regenerate.
  db.update(aiDraftJobs).set({ status: 'queued', updatedAt: now() }).where(eq(aiDraftJobs.status, 'running')).run();
  let running: Promise<void> | undefined;
  const timer = pollMs > 0 ? setInterval(() => {
    if (running) return;
    running = Promise.resolve().then(cleanup).then(() => runDraftJob(database, provider, now))
      .catch(() => { app.log.error('AI job polling failed.'); }).finally(() => { running = undefined; });
  }, pollMs) : undefined;
  timer?.unref();
  app.addHook('onClose', async () => { if (timer) clearInterval(timer); await running; });
}
