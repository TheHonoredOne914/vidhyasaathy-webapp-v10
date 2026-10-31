import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { GameSessionStartSchema, GameAnswerSchema, GameFinishSchema, type GameSessionStartResponse, type GameAnswerResponse, type GameFinishResponse } from '@vidhyasaathy/contracts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { Database } from '../db/index.ts';
import { gameSessions } from '../db/schema-phase4.ts';
import { ApiException, parseInput } from '../errors.ts';
import { xpFromEvidence } from '@vidhyasaathy/core/xp';

const GAME_CONFIG: Record<string, { conceptId: string; title: string; subjectId: string; subjectName: string; topic: string; chapterId: string; estMinutes: number; bestKind: 'time' | 'stars' | 'score'; checkpointKeys: string[] }> = {
  motion: { conceptId: 'motion_concept', title: 'Motion Graphs', subjectId: 'science', subjectName: 'Science', topic: 'Motion · graphs', chapterId: 'motion_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  graphs: { conceptId: 'graphs_concept', title: 'Graph Reading', subjectId: 'science', subjectName: 'Science', topic: 'Motion · graph reading', chapterId: 'motion_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  newton: { conceptId: 'newton_concept', title: 'Newton\'s Laws', subjectId: 'science', subjectName: 'Science', topic: 'Force · laws', chapterId: 'force_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  energy: { conceptId: 'energy_concept', title: 'Energy Forms', subjectId: 'science', subjectName: 'Science', topic: 'Work & Energy', chapterId: 'energy_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  matter: { conceptId: 'matter_concept', title: 'States of Matter', subjectId: 'science', subjectName: 'Science', topic: 'Matter · states', chapterId: 'matter_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  float: { conceptId: 'float_concept', title: 'Floating & Sinking', subjectId: 'science', subjectName: 'Science', topic: 'Matter · density', chapterId: 'matter_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  cell: { conceptId: 'cell_concept', title: 'Cell Structure', subjectId: 'science', subjectName: 'Science', topic: 'Cells · structure', chapterId: 'cell_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  poly: { conceptId: 'poly_concept', title: 'Polynomials', subjectId: 'maths', subjectName: 'Maths', topic: 'Algebra · polynomials', chapterId: 'poly_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  engine: { conceptId: 'engine_concept', title: 'Simple Machines', subjectId: 'science', subjectName: 'Science', topic: 'Work · machines', chapterId: 'work_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  atom: { conceptId: 'atom_concept', title: 'Atom Forge', subjectId: 'science', subjectName: 'Science', topic: 'Atoms · structure', chapterId: 'atom_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: [] },
  arena: { conceptId: 'arena_concept', title: 'Arena', subjectId: 'science', subjectName: 'Science', topic: 'Mixed practice', chapterId: 'arena_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  sound: { conceptId: 'sound_concept', title: 'Sound Waves', subjectId: 'science', subjectName: 'Science', topic: 'Waves · sound', chapterId: 'sound_chapter', estMinutes: 5, bestKind: 'score', checkpointKeys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
};

function getCheckpointItem(sqlite: Database['sqlite'], schoolId: string, gameId: string, checkpointKey: string) {
  const row = sqlite.prepare('SELECT * FROM game_checkpoint_map WHERE school_id=? AND game_id=? AND checkpoint_key=?').get(schoolId, gameId, checkpointKey) as { conceptId: string; itemId: string } | undefined;
  if (!row) return null;
  const item = sqlite.prepare('SELECT * FROM item WHERE id=? AND concept_id=? AND school_id=?').get(row.itemId, row.conceptId, schoolId) as { id: string; content: string } | undefined;
  if (!item) return null;
  return item;
}

export function registerGamesRoutes(app: FastifyInstance, database: Database, now: () => number) {
  const { db, sqlite } = database;
  const student = { preHandler: requireRole('student') };

  app.post('/games/:gameId/sessions', student, async (request, reply) => {
    const { gameId } = request.params as { gameId: string };
    const config = GAME_CONFIG[gameId];
    if (!config || gameId === 'atom') throw new ApiException(404, 'NOT_FOUND', 'This game is not available.');
    
    parseInput(GameSessionStartSchema, request.body);
    const { school, profile } = requireAuth(request);
    
    const sessionId = randomUUID();
    const time = now();
    
    db.insert(gameSessions).values({
      id: sessionId, schoolId: school.id, profileId: profile.id,
      gameId, conceptId: config.conceptId, startedAt: time,
      answered: 0, correct: 0,
    }).run();
    
    const checkpoints: Record<string, { itemId: string; stem: string; options: { id: string; text: string }[]; format: 'mcq' | 'numeric' | 'text'; level: number }> = {};
    for (const key of config.checkpointKeys) {
      const item = getCheckpointItem(database.sqlite, school.id, gameId, key);
      if (item) {
        const itemContent = JSON.parse(item.content) as { type: string; prompt: string; options: string[] };
        checkpoints[key] = {
          itemId: item.id,
          stem: itemContent.prompt,
          options: itemContent.options.map((opt, i) => ({ id: String(i), text: opt })),
          format: 'mcq',
          level: 1,
        };
      }
    }
    
    return reply.send({ sessionId, checkpoints } as GameSessionStartResponse);
  });

  app.post('/games/:gameId/sessions/:id/answer', student, async (request, reply) => {
    const { gameId, id } = request.params as { gameId: string; id: string };
    const config = GAME_CONFIG[gameId];
    if (!config || gameId === 'atom') throw new ApiException(404, 'NOT_FOUND', 'This game is not available.');
    
    const input = parseInput(GameAnswerSchema, request.body);
    const { school, profile } = requireAuth(request);
    
    const session = sqlite.prepare('SELECT * FROM game_session WHERE id=? AND school_id=? AND profile_id=?').get(id, school.id, profile.id) as { answered: number; correct: number; bestKind?: string; bestValue?: number; bestLabel?: string } | undefined;
    if (!session) throw new ApiException(404, 'NOT_FOUND', 'This game session is not available.');
    
    const checkpointMap = sqlite.prepare('SELECT * FROM game_checkpoint_map WHERE school_id=? AND game_id=? AND checkpoint_key=?').get(school.id, gameId, input.checkpointKey) as { conceptId: string; itemId: string } | undefined;
    if (!checkpointMap) throw new ApiException(404, 'NOT_FOUND', 'This checkpoint is not available.');
    
    const item = sqlite.prepare('SELECT * FROM item WHERE id=? AND concept_id=? AND school_id=?').get(checkpointMap.itemId, checkpointMap.conceptId, school.id) as { content: string } | undefined;
    if (!item) throw new ApiException(404, 'NOT_FOUND', 'This question is not available.');
    
    const itemContent = JSON.parse(item.content) as { type: string; options?: string[]; answer: string; explanation?: string };
    const correctOptionId = itemContent.options?.findIndex((opt) => opt === itemContent.answer) ?? 0;
    const isCorrect = input.answer && typeof input.answer === 'object' && 'optionId' in input.answer
      ? input.answer.optionId === String(correctOptionId)
      : false;
    
    const newAnswered = session.answered + 1;
    const newCorrect = session.correct + (isCorrect ? 1 : 0);
    
    sqlite.prepare('UPDATE game_session SET answered=?, correct=? WHERE id=?').run(newAnswered, newCorrect, id);
    
    const evidenceId = randomUUID();
    sqlite.prepare('INSERT INTO answer_evidence (id,school_id,profile_id,concept_id,item_id,level,correct,confidence,source,weight,time_ms,answer,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(evidenceId, school.id, profile.id, checkpointMap.conceptId, checkpointMap.itemId, 1, isCorrect ? 1 : 0, input.confidence, 'game', 0.5, input.timeMs, JSON.stringify(input.answer), now());
    
    const xp = xpFromEvidence([{ kind: 'answer', correct: isCorrect, confidence: input.confidence }]);
    sqlite.prepare('INSERT INTO learning_evidence (id,school_id,profile_id,concept_id,correct,source,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(randomUUID(), school.id, profile.id, checkpointMap.conceptId, isCorrect ? 1 : 0, 'game', now());
    
    // Record streak touch
    const day = new Date(now() + 330 * 60000).toISOString().slice(0, 10);
    sqlite.prepare('INSERT OR IGNORE INTO streak_touch (profile_id, school_id, day, act, source_event_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(profile.id, school.id, day, 'game_round', id, now());
    
    return reply.send({
      correct: isCorrect,
      correctOptionId: isCorrect ? undefined : String(correctOptionId),
      explanation: itemContent.explanation ?? 'Keep practicing!',
      misconceptionNote: isCorrect ? undefined : 'Review this concept.',
      errorType: isCorrect ? undefined : 'concept_gap',
      xp,
    } as GameAnswerResponse);
  });

  app.post('/games/:gameId/sessions/:id/finish', student, async (request, reply) => {
    const { gameId, id } = request.params as { gameId: string; id: string };
    const config = GAME_CONFIG[gameId];
    if (!config || gameId === 'atom') throw new ApiException(404, 'NOT_FOUND', 'This game is not available.');
    
    parseInput(GameFinishSchema, request.body);
    const { school, profile } = requireAuth(request);
    
    const session = sqlite.prepare('SELECT * FROM game_session WHERE id=? AND school_id=? AND profile_id=?').get(id, school.id, profile.id) as { answered: number; correct: number; bestKind?: string; bestValue?: number; bestLabel?: string; startedAt: number } | undefined;
    if (!session) throw new ApiException(404, 'NOT_FOUND', 'This game session is not available.');
    
    const time = now();
    let personalBest = false;
    let bestKind = config.bestKind;
    let bestValue: number;
    let bestLabel: string;
    
    if (bestKind === 'time') {
      bestValue = time - session.startedAt;
      bestLabel = `Best ${bestValue} s`;
    } else if (bestKind === 'stars') {
      bestValue = Math.max(1, Math.ceil((session.correct / Math.max(1, session.answered)) * 3));
      bestLabel = `${bestValue} stars`;
    } else {
      bestValue = session.correct;
      bestLabel = `Best ${bestValue}/10`;
    }
    
    const hasPreviousBest = session.bestValue != null;
    if (!hasPreviousBest || (bestKind === 'time' && bestValue < session.bestValue!) || (bestKind !== 'time' && bestValue > session.bestValue!)) {
      personalBest = true;
      sqlite.prepare('UPDATE game_session SET finished_at=?, best_kind=?, best_value=?, best_label=? WHERE id=?').run(time, bestKind, bestValue, bestLabel, id);
    } else {
      sqlite.prepare('UPDATE game_session SET finished_at=? WHERE id=?').run(time, id);
    }
    
    const xp = xpFromEvidence([{ kind: 'answer', correct: session.correct > 0, confidence: 'sure' }]);
    
    return reply.send({
      answered: session.answered,
      correct: session.correct,
      personalBest,
      best: { kind: bestKind, value: bestValue, label: bestLabel },
      xp,
    } as GameFinishResponse);
  });

  app.get('/games/:gameId/best', student, async (request) => {
    const { gameId } = request.params as { gameId: string };
    const config = GAME_CONFIG[gameId];
    if (!config || gameId === 'atom') throw new ApiException(404, 'NOT_FOUND', 'This game is not available.');
    
    const { school, profile } = requireAuth(request);
    const session = sqlite.prepare('SELECT best_kind, best_value, best_label FROM game_session WHERE school_id=? AND profile_id=? AND game_id=? AND best_value IS NOT NULL ORDER BY finished_at DESC LIMIT 1').get(school.id, profile.id, gameId) as { bestKind: string; bestValue: number; bestLabel: string } | undefined;
    
    if (!session) return { best: null, conceptName: config.title };
    
    return {
      best: { kind: session.bestKind as 'time' | 'stars' | 'score', value: session.bestValue, label: session.bestLabel },
      conceptName: config.title,
    };
  });
}