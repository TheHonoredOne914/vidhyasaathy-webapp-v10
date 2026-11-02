import { randomUUID } from 'node:crypto';
import { AiDraftSchema, type AiDraft, type DraftJob } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database, Db } from '../db/index.ts';
import { aiDraftJobs, assignmentItems, assignments, concepts, items, learningSessions, noteConcepts, notes, slides } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { found, scope } from '../school/access.ts';
import type { DraftSource, LlmProvider } from './provider.ts';
import { digest } from './retrieval.ts';

export function draftSource(db: Db, note: typeof notes.$inferSelect): DraftSource {
  const tags = db.select({ id: concepts.id, title: concepts.title }).from(noteConcepts)
    .innerJoin(concepts, eq(concepts.id, noteConcepts.conceptId))
    .where(and(eq(noteConcepts.schoolId, note.schoolId), eq(noteConcepts.noteId, note.id))).orderBy(concepts.id).all();
  return { noteId: note.id, title: note.title, body: note.body, concepts: tags };
}

export function validateDraft(draft: AiDraft, source: DraftSource) {
  AiDraftSchema.parse(draft);
  const allowed = new Set(source.concepts.map((concept) => concept.id));
  if (draft.slides.some((slide) => !allowed.has(slide.conceptId) || slide.noteId !== source.noteId)
    || draft.check.some((item) => !allowed.has(item.conceptId) || item.sourceRef?.noteId !== source.noteId)) {
    throw new ApiException(400, 'DRAFT_SOURCE_MISMATCH', 'Use only this note and its tagged concepts.');
  }
}

export function draftJobView(row: typeof aiDraftJobs.$inferSelect): DraftJob {
  const { id, schoolId, noteId, sectionId, status, message, draft, sessionId, assignmentId, createdAt, updatedAt } = row;
  return { id, schoolId, noteId, sectionId, status, message, draft, sessionId, assignmentId, createdAt, updatedAt };
}

export async function runDraftJob(database: Database, provider: LlmProvider, now: () => number) {
  const { db } = database;
  const job = db.transaction(() => {
    const next = db.select().from(aiDraftJobs).where(eq(aiDraftJobs.status, 'queued')).orderBy(aiDraftJobs.createdAt).get();
    return next ? db.update(aiDraftJobs).set({ status: 'running', updatedAt: now() })
      .where(and(eq(aiDraftJobs.id, next.id), eq(aiDraftJobs.status, 'queued'))).returning().get() : undefined;
  });
  if (!job) return;
  try {
    if (!provider.configured) {
      db.update(aiDraftJobs).set({ status: 'not_configured', message: 'AI not configured', updatedAt: now() }).where(eq(aiDraftJobs.id, job.id)).run();
      return;
    }
    const note = found(db.select().from(notes).where(scope(notes, job.schoolId, job.noteId)).get());
    const source = draftSource(db, note);
    if (digest(source) !== job.sourceHash) throw new Error('Source changed.');
    const draft = await provider.draft({ ...source, schoolId: job.schoolId });
    if (!draft) throw new Error('No grounded draft.');
    validateDraft(draft, source);
    const latest = found(db.select().from(notes).where(scope(notes, job.schoolId, job.noteId)).get());
    if (digest(draftSource(db, latest)) !== job.sourceHash) throw new Error('Source changed.');
    db.update(aiDraftJobs).set({ status: 'ready', draft, updatedAt: now() }).where(eq(aiDraftJobs.id, job.id)).run();
  } catch {
    db.update(aiDraftJobs).set({ status: 'failed', message: 'A grounded draft could not be created. Check the note and try a new job.', updatedAt: now() })
      .where(eq(aiDraftJobs.id, job.id)).run();
  }
}

export function approveDraft(db: Db, job: typeof aiDraftJobs.$inferSelect, draft: AiDraft, teacherId: string, dueAt: number, now: number) {
  const note = found(db.select().from(notes).where(scope(notes, job.schoolId, job.noteId)).get());
  const source = draftSource(db, note);
  if (digest(source) !== job.sourceHash) throw new ApiException(409, 'DRAFT_SOURCE_CHANGED', 'The note changed. Create a new draft job.');
  validateDraft(draft, source);
  const sessionId = randomUUID();
  const assignmentId = randomUUID();
  const shared = { schoolId: job.schoolId, chapterId: job.chapterId };
  db.insert(learningSessions).values({ ...shared, id: sessionId, sectionId: job.sectionId, title: draft.title, updatedAt: now }).run();
  draft.slides.forEach((slide, position) => db.insert(slides).values({ ...shared, ...slide, sessionId, id: randomUUID(), position }).run());
  db.insert(assignments).values({ ...shared, id: assignmentId, sectionId: job.sectionId, teacherId, title: draft.title, kind: 'quiz', dueAt, updatedAt: now }).run();
  draft.check.forEach((content, position) => {
    db.insert(items).values({ ...shared, id: randomUUID(), sessionId, conceptId: content.conceptId, position, content }).run();
    const itemId = randomUUID();
    db.insert(items).values({ ...shared, id: itemId, conceptId: content.conceptId, position, content }).run();
    db.insert(assignmentItems).values({ ...shared, assignmentId, itemId, position }).run();
  });
  return db.update(aiDraftJobs).set({ status: 'approved', draft, sessionId, assignmentId, updatedAt: now })
    .where(eq(aiDraftJobs.id, job.id)).returning().get()!;
}
