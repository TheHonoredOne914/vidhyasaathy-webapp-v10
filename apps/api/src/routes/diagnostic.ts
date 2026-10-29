import { DiagnosticOfferSchema, DiagnosticResultSchema, SubmitDiagnosticSchema } from '@vidhyasaathy/contracts';
import { clampLevel, isNotTaughtAnswer, NEW_WORD, type Confidence } from '@vidhyasaathy/core/learning';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { markItem } from '../assessment/service.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { chapterAccess, resourceId } from '../content/access.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { diagnosticResults, items } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { diagnosticMessage, mistakeFor, placeDiagnostic, recordAnswer } from '../learning/record.ts';
import { mutate } from '../school/access.ts';

function diagnosticItems(db: Db, schoolId: string, chapterId: string) {
  return db.select().from(items).where(and(eq(items.schoolId, schoolId), eq(items.chapterId, chapterId))).all()
    .filter((row) => row.content.role === 'diagnostic')
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

export function registerDiagnosticRoutes(app: FastifyInstance, db: Db, now: () => number) {
  const student = { preHandler: requireRole('student') };
  app.get('/chapters/:id/diagnostic', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    const taken = db.select().from(diagnosticResults).where(and(eq(diagnosticResults.profileId, profile.id), eq(diagnosticResults.chapterId, chapter.id))).get();
    const questions = diagnosticItems(db, school.id, chapter.id);
    return DiagnosticOfferSchema.parse({
      chapterId: chapter.id, offered: !taken && questions.length >= 5, title: "Let's see what you already know",
      questions: taken ? [] : questions.map(publicItem),
    });
  });
  app.post('/chapters/:id/diagnostic', student, async (request) => mutate(() => {
    const input = parseInput(SubmitDiagnosticSchema, request.body);
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    if (db.select().from(diagnosticResults).where(and(eq(diagnosticResults.profileId, profile.id), eq(diagnosticResults.chapterId, chapter.id))).get()) {
      throw new ApiException(409, 'DIAGNOSTIC_DONE', 'This chapter check is already saved.');
    }
    const questions = diagnosticItems(db, school.id, chapter.id);
    const ids = new Set(input.answers.map((answer) => answer.itemId));
    if (!questions.length || ids.size !== input.answers.length || questions.some((item) => !ids.has(item.id)) || ids.size !== questions.length) {
      throw new ApiException(400, 'INCOMPLETE_CHECK', 'Answer each question once.');
    }
    const timestamp = now();
    const results = questions.map((item) => {
      const submitted = input.answers.find((answer) => answer.itemId === item.id)!;
      const notTaught = isNotTaughtAnswer(submitted.answer);
      const correct = notTaught ? false : markItem(item.content, submitted.answer) === true;
      const feedback = mistakeFor(item.content, submitted.answer);
      recordAnswer(db, {
        id: `diagnostic:${chapter.id}:${profile.id}:${item.id}`, schoolId: school.id, profileId: profile.id,
        conceptId: item.conceptId, chapterId: chapter.id, itemId: item.id, level: clampLevel(item.content.difficulty),
        correct, confidence: submitted.confidence as Confidence, source: 'diagnostic', timeMs: submitted.timeMs,
        answer: submitted.answer, markedFamily: feedback.errorType, explanation: feedback.explanation,
        step: !notTaught,
      }, timestamp);
      return { correct, notTaught };
    });
    const entry = placeDiagnostic(db, school.id, profile.id, chapter.id, results, timestamp);
    return DiagnosticResultSchema.parse({ chapterId: chapter.id, route: entry.route, word: NEW_WORD, message: diagnosticMessage(entry.route) });
  }));
}
