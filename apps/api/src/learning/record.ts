import { and, asc, eq } from 'drizzle-orm';
import type { SaveItem } from '@vidhyasaathy/contracts';
import {
  BRIDGE_ON_DROP, chapterBand, clampLevel, classifyError, diagnosticEntry, initialLadder, isNotTaughtAnswer,
  masteryFromEvents, stepLadder, type Confidence, type DiagnosticRoute, type ErrorFamily, type LearningEvent, type Level,
} from '@vidhyasaathy/core/learning';
import type { Db } from '../db/index.ts';
import { answerEvidence, bandEvents, chapterBands, conceptLadders, concepts, diagnosticResults } from '../db/schema.ts';

export type EvidenceSource = 'session' | 'quiz' | 'homework' | 'diagnostic' | 'flashcard' | 'remediation' | 'practice' | `game:${string}`;

const FALLBACK = 'Look at this idea again, then try a simpler question.';

export function mistakeFor(content: SaveItem, answer: unknown) {
  const explanation = 'explanation' in content ? content.explanation ?? null : null;
  if (content.type !== 'mcq' || typeof answer !== 'string') return { errorType: null as ErrorFamily | null, explanation };
  const tagged = content.mistakes?.find((row) => row.option === answer);
  return { errorType: tagged?.errorType ?? null, explanation: tagged?.explanation ?? explanation };
}

function asEvent(row: { correct: boolean; confidence: Confidence; level: number; timeMs: number; notTaught: boolean }): LearningEvent {
  return { correct: row.correct, confidence: row.confidence, level: clampLevel(row.level), timeMs: row.timeMs, notTaught: row.notTaught };
}

export function refreshChapterBand(db: Db, schoolId: string, profileId: string, chapterId: string, timestamp: number) {
  const conceptRows = db.select().from(concepts).where(and(eq(concepts.schoolId, schoolId), eq(concepts.chapterId, chapterId))).all()
    .filter((row) => row.sourceClass == null || row.sourceClass >= 9);
  const ladders = db.select().from(conceptLadders).where(and(eq(conceptLadders.schoolId, schoolId), eq(conceptLadders.profileId, profileId))).all();
  const scores = conceptRows.flatMap((concept) => {
    const ladder = ladders.find((row) => row.conceptId === concept.id);
    return ladder?.masteryLevel == null ? [] : [ladder.masteryScore];
  });
  const band = chapterBand(scores);
  if (!band) return null;
  const current = db.select().from(chapterBands).where(and(eq(chapterBands.profileId, profileId), eq(chapterBands.chapterId, chapterId))).get();
  if (current?.band === band) return band;
  db.insert(chapterBands).values({ schoolId, profileId, chapterId, band, updatedAt: timestamp }).onConflictDoUpdate({
    target: [chapterBands.profileId, chapterBands.chapterId], set: { band, updatedAt: timestamp },
  }).run();
  db.insert(bandEvents).values({
    id: `band:${profileId}:${chapterId}:${timestamp}:${band}`, schoolId, profileId, chapterId,
    fromBand: current?.band ?? null, toBand: band, createdAt: timestamp,
  }).onConflictDoNothing().run();
  return band;
}

export function recordAnswer(db: Db, input: {
  id: string; schoolId: string; profileId: string; conceptId: string; chapterId: string; itemId: string;
  level: Level; correct: boolean; confidence: Confidence; source: EvidenceSource; timeMs: number;
  answer: string | string[]; markedFamily?: ErrorFamily | null; explanation?: string | null; step?: boolean;
}, timestamp: number) {
  const notTaught = isNotTaughtAnswer(input.answer);
  const existing = db.select().from(answerEvidence).where(eq(answerEvidence.id, input.id)).get();
  const prior = db.select().from(conceptLadders).where(and(eq(conceptLadders.profileId, input.profileId), eq(conceptLadders.conceptId, input.conceptId))).get();
  if (!existing) {
    const errorType = classifyError({
      correct: input.correct, confidence: input.confidence, level: input.level, timeMs: input.timeMs,
      markedFamily: input.markedFamily ?? null, notTaught,
    }, (prior?.masteryLevel ?? null) as Level | null);
    db.insert(answerEvidence).values({
      id: input.id, schoolId: input.schoolId, profileId: input.profileId, conceptId: input.conceptId, itemId: input.itemId,
      level: input.level, correct: notTaught ? false : input.correct, confidence: input.confidence, source: input.source,
      errorType, timeMs: input.timeMs, answer: input.answer, notTaught, createdAt: timestamp,
    }).run();
    if (input.step !== false && !notTaught) {
      const next = stepLadder(prior
        ? { level: prior.ladderLevel as Level, streakCorrect: prior.streakCorrect, streakWrong: prior.streakWrong }
        : initialLadder(), input.correct);
      const history = db.select().from(answerEvidence).where(and(eq(answerEvidence.profileId, input.profileId), eq(answerEvidence.conceptId, input.conceptId))).all();
      const mastery = masteryFromEvents(history.map(asEvent));
      const bridge = next.dropped ? next.bridge : next.level > (prior?.ladderLevel ?? 2) ? null : prior?.bridge ?? null;
      const state = {
        schoolId: input.schoolId, profileId: input.profileId, conceptId: input.conceptId, ladderLevel: next.level,
        streakCorrect: next.streakCorrect, streakWrong: next.streakWrong, masteryLevel: mastery.level, masteryScore: mastery.score,
        misconception: mastery.misconception, bridge, updatedAt: timestamp,
      };
      db.insert(conceptLadders).values(state).onConflictDoUpdate({
        target: [conceptLadders.profileId, conceptLadders.conceptId], set: state,
      }).run();
      refreshChapterBand(db, input.schoolId, input.profileId, input.chapterId, timestamp);
    }
  }
  const saved = db.select().from(conceptLadders).where(and(eq(conceptLadders.profileId, input.profileId), eq(conceptLadders.conceptId, input.conceptId))).get();
  const errorType = (existing?.errorType ?? db.select().from(answerEvidence).where(eq(answerEvidence.id, input.id)).get()?.errorType ?? null) as ErrorFamily | null;
  const explanation = input.correct || notTaught ? null : (input.explanation ?? FALLBACK);
  return { errorType: input.correct || notTaught ? null : errorType, bridge: saved?.bridge ?? null, explanation };
}

export function rebuildLearner(db: Db, schoolId: string, profileId: string, timestamp: number) {
  const rows = db.select().from(answerEvidence).where(and(eq(answerEvidence.schoolId, schoolId), eq(answerEvidence.profileId, profileId)))
    .orderBy(asc(answerEvidence.createdAt), asc(answerEvidence.id)).all();
  const conceptRows = db.select().from(concepts).where(eq(concepts.schoolId, schoolId)).all();
  const byConcept = new Map<string, typeof rows>();
  for (const row of rows) byConcept.set(row.conceptId, [...(byConcept.get(row.conceptId) ?? []), row]);
  for (const [conceptId, events] of byConcept) {
    let state = initialLadder();
    let bridge: string | null = null;
    for (const event of events) {
      if (event.notTaught) continue;
      const next = stepLadder(state, event.correct);
      if (next.dropped) bridge = next.bridge;
      else if (next.level > state.level) bridge = null;
      state = { level: next.level, streakCorrect: next.streakCorrect, streakWrong: next.streakWrong };
    }
    const mastery = masteryFromEvents(events.map(asEvent));
    const saved = {
      schoolId, profileId, conceptId, ladderLevel: state.level, streakCorrect: state.streakCorrect, streakWrong: state.streakWrong,
      masteryLevel: mastery.level, masteryScore: mastery.score, misconception: mastery.misconception, bridge, updatedAt: timestamp,
    };
    db.insert(conceptLadders).values(saved).onConflictDoUpdate({ target: [conceptLadders.profileId, conceptLadders.conceptId], set: saved }).run();
  }
  for (const chapterId of new Set(conceptRows.filter((row) => byConcept.has(row.id)).map((row) => row.chapterId))) {
    refreshChapterBand(db, schoolId, profileId, chapterId, timestamp);
  }
}

export function placeDiagnostic(db: Db, schoolId: string, profileId: string, chapterId: string, results: { correct: boolean; notTaught: boolean }[], timestamp: number) {
  const entry = diagnosticEntry(results);
  const chapterConcepts = db.select().from(concepts).where(and(eq(concepts.schoolId, schoolId), eq(concepts.chapterId, chapterId))).all()
    .filter((row) => row.sourceClass == null);
  for (const concept of chapterConcepts) {
    const prior = db.select().from(conceptLadders).where(and(eq(conceptLadders.profileId, profileId), eq(conceptLadders.conceptId, concept.id))).get();
    const saved = {
      schoolId, profileId, conceptId: concept.id, ladderLevel: entry.level, streakCorrect: 0, streakWrong: 0,
      masteryLevel: prior?.masteryLevel ?? null, masteryScore: prior?.masteryScore ?? 0, misconception: prior?.misconception ?? false,
      bridge: entry.route === 'repair' ? BRIDGE_ON_DROP : null, updatedAt: timestamp,
    };
    db.insert(conceptLadders).values(saved).onConflictDoUpdate({
      target: [conceptLadders.profileId, conceptLadders.conceptId],
      set: { ladderLevel: saved.ladderLevel, streakCorrect: 0, streakWrong: 0, bridge: saved.bridge, updatedAt: timestamp },
    }).run();
  }
  db.insert(diagnosticResults).values({ schoolId, profileId, chapterId, route: entry.route, createdAt: timestamp }).onConflictDoNothing().run();
  return entry;
}

export function diagnosticMessage(route: DiagnosticRoute) {
  if (route === 'challenge') return 'You already know the earlier ideas. We will start with a twist.';
  if (route === 'repair') return BRIDGE_ON_DROP;
  return 'We will start in the middle and adjust as you go.';
}
