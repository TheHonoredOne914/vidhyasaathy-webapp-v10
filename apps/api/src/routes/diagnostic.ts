import { DiagnosticOfferSchema, DiagnosticResultSchema, SubmitDiagnosticSchema } from '@vidhyasaathy/contracts';
import { DiagnosticSkipSchema, DiagnosticSkipResultSchema } from '../../../../packages/contracts/src/student-flow.ts';
import { clampLevel, isNotTaughtAnswer, NEW_WORD, type Confidence } from '@vidhyasaathy/core/learning';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { markItem } from '../assessment/service.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { chapterAccess, resourceId } from '../content/access.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import { answerEvidence, chapters, classes, concepts, conceptPrereqs, diagnosticResults, items, subjects } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { diagnosticMessage, mistakeFor, placeDiagnostic, recordAnswer } from '../learning/record.ts';
import { mutate } from '../school/access.ts';

export function diagnosticItems(db: Db, schoolId: string, chapterId: string) {
  const chapterRows = db.select().from(chapters).where(eq(chapters.schoolId, schoolId)).all();
  const chapter = chapterRows.find((row) => row.id === chapterId)!;
  const subject = db.select().from(subjects).where(and(eq(subjects.schoolId, schoolId), eq(subjects.id, chapter.subjectId))).get()!;
  const schoolClass = db.select().from(classes).where(and(eq(classes.schoolId, schoolId), eq(classes.id, subject.classId))).get()!;
  const grade = Number(schoolClass.name.match(/\d+/)?.[0] ?? 0);
  const conceptRows = db.select().from(concepts).where(eq(concepts.schoolId, schoolId)).all();
  const targets = new Set(conceptRows.filter((row) => row.chapterId === chapterId && (row.sourceClass === null || row.sourceClass === grade)).map((row) => row.id));
  const prereqs = new Set(db.select().from(conceptPrereqs).where(eq(conceptPrereqs.schoolId, schoolId)).all()
    .filter((edge) => targets.has(edge.conceptId)).map((edge) => edge.prereqId));
  const eligible = new Set(conceptRows.filter((row) => {
    if (!prereqs.has(row.id) || row.sourceClass === null) return false;
    if (row.sourceClass >= 6 && row.sourceClass < grade) return true;
    const earlier = chapterRows.find((candidate) => candidate.id === row.chapterId);
    return row.sourceClass === grade && earlier?.subjectId === chapter.subjectId && earlier.position < chapter.position;
  }).map((row) => row.id));
  return db.select().from(items).where(eq(items.schoolId, schoolId)).all()
    .filter((row) => row.content.role === 'diagnostic' && eligible.has(row.conceptId)
      && row.content.type === 'mcq' && row.content.options.some(isNotTaughtAnswer))
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).slice(0, 8);
}

export function registerDiagnosticRoutes(app: FastifyInstance, db: Db, now: () => number) {
  const student = { preHandler: requireRole('student') };
  function taken(schoolId: string, profileId: string, chapterId: string) {
    const row = db.select().from(diagnosticResults).where(and(eq(diagnosticResults.schoolId, schoolId),
      eq(diagnosticResults.profileId, profileId), eq(diagnosticResults.chapterId, chapterId))).get();
    return row && (!row.skipped || row.createdAt > now() - 7 * 86_400_000) ? row : undefined;
  }
  app.post('/chapters/:id/diagnostic/skip', student, async (request) => {
    parseInput(DiagnosticSkipSchema, request.body ?? {});
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    const timestamp = now();
    db.insert(diagnosticResults).values({ schoolId: school.id, profileId: profile.id, chapterId: chapter.id,
      route: 'steady', skipped: true, createdAt: timestamp }).onConflictDoUpdate({
      target: [diagnosticResults.profileId, diagnosticResults.chapterId], set: { skipped: true, createdAt: timestamp },
      setWhere: eq(diagnosticResults.skipped, true),
    }).run();
    return DiagnosticSkipResultSchema.parse({ offered: false, nextOfferAt: new Date(timestamp + 7 * 86_400_000).toISOString() });
  });
  app.get('/chapters/:id/notebook-diagnostic', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    const questions = diagnosticItems(db, school.id, chapter.id);
    const completed = taken(school.id, profile.id, chapter.id);
    const ids = new Set(questions.map((row) => row.id));
    const evidence = db.select().from(answerEvidence).where(and(eq(answerEvidence.schoolId, school.id),
      eq(answerEvidence.profileId, profile.id), eq(answerEvidence.source, 'diagnostic'))).all().filter((row) => ids.has(row.itemId));
    return { chapterId: chapter.id, offered: !completed && questions.length >= 5, title: "Let's see what you already know",
      questions: completed || questions.length < 5 ? [] : questions.map((row) => ({ ...publicItem(row),
        sourceClass: db.select().from(concepts).where(and(eq(concepts.schoolId, school.id), eq(concepts.id, row.conceptId))).get()!.sourceClass })),
      soFar: { answered: evidence.length, total: questions.length, gotIt: evidence.filter((row) => row.correct && !row.notTaught).length,
        workingOn: evidence.filter((row) => row.correct === false && !row.notTaught).length,
        notTaught: evidence.filter((row) => row.notTaught).length },
    };
  });
  app.get('/chapters/:id/diagnostic', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    const completed = taken(school.id, profile.id, chapter.id);
    const questions = diagnosticItems(db, school.id, chapter.id);
    return DiagnosticOfferSchema.parse({
      chapterId: chapter.id, offered: !completed && questions.length >= 5, title: "Let's see what you already know",
      questions: completed || questions.length < 5 ? [] : questions.map(publicItem),
    });
  });
  app.post('/chapters/:id/diagnostic', student, async (request) => mutate(() => {
    const input = parseInput(SubmitDiagnosticSchema, request.body);
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    if (taken(school.id, profile.id, chapter.id)?.skipped === false) {
      throw new ApiException(409, 'DIAGNOSTIC_DONE', 'This chapter check is already saved.');
    }
    const questions = diagnosticItems(db, school.id, chapter.id);
    const ids = new Set(input.answers.map((answer) => answer.itemId));
    if (questions.length < 5 || ids.size !== input.answers.length || questions.some((item) => !ids.has(item.id)) || ids.size !== questions.length) {
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
    db.delete(diagnosticResults).where(and(eq(diagnosticResults.schoolId, school.id), eq(diagnosticResults.profileId, profile.id), eq(diagnosticResults.chapterId, chapter.id), eq(diagnosticResults.skipped, true))).run();
    const entry = placeDiagnostic(db, school.id, profile.id, chapter.id, results, timestamp);
    return DiagnosticResultSchema.parse({ chapterId: chapter.id, route: entry.route, word: NEW_WORD, message: diagnosticMessage(entry.route) });
  }));
}
