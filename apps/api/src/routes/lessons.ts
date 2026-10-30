import {
  CheckpointResultSchema, ConceptLessonSchema, ExplainResultSchema, FlashcardResultSchema, LabelResultSchema,
  LessonViewSchema, RevisionQueuedSchema, SubmitCheckpointSchema, SubmitExplainSchema, SubmitFadedSchema,
  SubmitFlashcardSchema, SubmitLabelSchema, toPublicLesson,
} from '@vidhyasaathy/contracts';
import { pickNoteVariant, prereqIsWeak } from '@vidhyasaathy/core/learn';
import { clampLevel, type Confidence } from '@vidhyasaathy/core/learning';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { chapterAccess, resourceId } from '../content/access.ts';
import type { Db } from '../db/index.ts';
import { conceptLadders, conceptLessons, conceptPrereqs, concepts } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { enqueueRevision } from '../learning/revise.ts';
import { recordAnswer } from '../learning/record.ts';
import { found, mutate, scope } from '../school/access.ts';

const normalize = (value: string) => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

function conceptFor(db: Db, request: Parameters<typeof chapterAccess>[1], id: string) {
  const { school } = requireAuth(request);
  const concept = found(db.select().from(concepts).where(scope(concepts, school.id, id)).get());
  chapterAccess(db, request, concept.chapterId);
  return concept;
}

function storedLesson(db: Db, schoolId: string, conceptId: string) {
  const row = db.select().from(conceptLessons).where(and(eq(conceptLessons.conceptId, conceptId), eq(conceptLessons.schoolId, schoolId))).get();
  if (!row) return null;
  return ConceptLessonSchema.parse(row.body);
}

export function registerLessonRoutes(app: FastifyInstance, db: Db, now: () => number) {
  const student = { preHandler: requireRole('student') };

  app.get('/concepts/:id/lesson', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    const lesson = storedLesson(db, school.id, concept.id);
    if (!lesson) return LessonViewSchema.parse({ found: false });
    const simpler = typeof request.query === 'object' && request.query !== null && 'simpler' in request.query && request.query.simpler === '1';
    const ladders = db.select().from(conceptLadders).where(and(eq(conceptLadders.schoolId, school.id), eq(conceptLadders.profileId, profile.id))).all();
    const mine = ladders.find((row) => row.conceptId === concept.id);
    const edges = db.select().from(conceptPrereqs).where(and(eq(conceptPrereqs.schoolId, school.id), eq(conceptPrereqs.conceptId, concept.id))).all();
    const weak = edges.some((edge) => {
      const row = ladders.find((ladder) => ladder.conceptId === edge.prereqId);
      return prereqIsWeak(row ? { masteryLevel: row.masteryLevel, misconception: row.misconception } : null);
    });
    const variant = pickNoteVariant(mine ? clampLevel(mine.ladderLevel) : null, simpler);
    return LessonViewSchema.parse({
      ...toPublicLesson(lesson, { conceptId: concept.id, title: concept.title, variant, weakPrereq: weak }),
      found: true,
    });
  });

  app.post('/concepts/:id/lesson/checkpoint', student, async (request) => mutate(() => {
    const input = parseInput(SubmitCheckpointSchema, request.body);
    const { school, profile } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    const lesson = storedLesson(db, school.id, concept.id);
    const step = lesson?.steps.find((row) => row.checkpoint.id === input.itemId);
    if (!lesson || !step) throw new ApiException(404, 'NOT_FOUND', 'That check is not on this page.');
    if (!step.checkpoint.options.includes(input.answer)) throw new ApiException(400, 'INVALID_ANSWER', 'Choose one of the options.');
    const correct = input.answer === step.checkpoint.answer;
    recordAnswer(db, {
      id: `learn:${profile.id}:${input.itemId}`, schoolId: school.id, profileId: profile.id, conceptId: concept.id,
      chapterId: concept.chapterId, itemId: input.itemId, level: 1, correct, confidence: input.confidence as Confidence,
      source: 'session', timeMs: input.timeMs, answer: input.answer, explanation: step.checkpoint.explanation,
    }, now());
    return CheckpointResultSchema.parse({ correct, explanation: step.checkpoint.explanation });
  }));

  app.post('/concepts/:id/lesson/faded', student, async (request) => mutate(() => {
    const input = parseInput(SubmitFadedSchema, request.body);
    const { school, profile } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    const lesson = storedLesson(db, school.id, concept.id);
    if (!lesson) throw new ApiException(404, 'NOT_FOUND', 'That page has no practice yet.');
    const correct = lesson.faded.answers.some((answer) => normalize(answer) === normalize(input.answer));
    recordAnswer(db, {
      id: `learn:${profile.id}:${lesson.faded.itemId}:${input.hinted ? 'hint' : 'plain'}`, schoolId: school.id, profileId: profile.id,
      conceptId: concept.id, chapterId: concept.chapterId, itemId: lesson.faded.itemId, level: input.hinted ? 1 : 2,
      correct, confidence: input.confidence as Confidence, source: 'practice', timeMs: input.timeMs, answer: input.answer,
      explanation: lesson.faded.hint, step: !input.hinted,
    }, now());
    return CheckpointResultSchema.parse({
      correct,
      explanation: correct ? 'That matches the idea.' : lesson.faded.hint,
    });
  }));

  app.post('/concepts/:id/lesson/explain', student, async (request) => mutate(() => {
    const input = parseInput(SubmitExplainSchema, request.body);
    const { school, profile } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    const lesson = storedLesson(db, school.id, concept.id);
    if (!lesson) throw new ApiException(404, 'NOT_FOUND', 'That page has no explain-back yet.');
    const correct = lesson.explainBack.gapAnswers.some((answer) => normalize(answer) === normalize(input.gap));
    recordAnswer(db, {
      id: `learn:${profile.id}:${lesson.explainBack.itemId}`, schoolId: school.id, profileId: profile.id, conceptId: concept.id,
      chapterId: concept.chapterId, itemId: lesson.explainBack.itemId, level: 2, correct, confidence: input.confidence as Confidence,
      source: 'session', timeMs: input.timeMs, answer: [input.gap, input.ownWords], explanation: lesson.explainBack.gap,
    }, now());
    enqueueRevision(db, school.id, profile.id, concept.id, now());
    return ExplainResultSchema.parse({
      correct, queued: true,
      explanation: correct ? 'The gap is filled, and this idea will come back in 1, 3 and 7 days.' : 'Read the sentence again and try the missing word.',
    });
  }));

  app.post('/concepts/:id/lesson/flashcard', student, async (request) => mutate(() => {
    const input = parseInput(SubmitFlashcardSchema, request.body);
    const { school, profile } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    const lesson = storedLesson(db, school.id, concept.id);
    const card = lesson?.flashcards.find((row) => row.id === input.cardId);
    if (!lesson || !card) throw new ApiException(404, 'NOT_FOUND', 'That card is not on this page.');
    const confidence: Confidence = input.rating === 'knew' ? 'sure' : input.rating === 'almost' ? 'unsure' : 'guess';
    recordAnswer(db, {
      id: `learn:${profile.id}:${card.id}`, schoolId: school.id, profileId: profile.id, conceptId: concept.id,
      chapterId: concept.chapterId, itemId: card.id, level: 1, correct: input.rating !== 'forgot', confidence,
      source: 'flashcard', timeMs: input.timeMs, answer: input.rating,
    }, now());
    enqueueRevision(db, school.id, profile.id, concept.id, now());
    return FlashcardResultSchema.parse({ queued: true });
  }));

  app.post('/concepts/:id/lesson/label', student, async (request) => mutate(() => {
    const input = parseInput(SubmitLabelSchema, request.body);
    const { school } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    const lesson = storedLesson(db, school.id, concept.id);
    const block = lesson?.blocks[input.blockIndex];
    if (!lesson || !block || block.kind !== 'drag_label') throw new ApiException(404, 'NOT_FOUND', 'That diagram is not on this page.');
    const correct = block.pairs.length === input.placements.length && block.pairs.every((pair) =>
      input.placements.some((placed) => placed.labelId === pair.labelId && placed.targetId === pair.targetId));
    return LabelResultSchema.parse({ correct, explanation: block.fix });
  }));

  app.post('/concepts/:id/lesson/revision', student, async (request) => mutate(() => {
    parseInput(z.object({}).strict(), request.body ?? {});
    const { school, profile } = requireAuth(request);
    const concept = conceptFor(db, request, resourceId(request));
    if (!storedLesson(db, school.id, concept.id)) throw new ApiException(404, 'NOT_FOUND', 'That page is not ready for revision.');
    enqueueRevision(db, school.id, profile.id, concept.id, now());
    return RevisionQueuedSchema.parse({ days: [1, 3, 7] });
  }));
}
