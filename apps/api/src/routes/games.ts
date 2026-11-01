import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { GameSessionStartSchema, GameAnswerSchema, GameFinishSchema, SaveItemSchema, type GameAnswerResponse, type GameFinishResponse, type GameSessionStartResponse } from '@vidhyasaathy/contracts';
import { xpFromEvidence } from '@vidhyasaathy/core/xp';
import { clampLevel } from '@vidhyasaathy/core/learning';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { chapterAccess, isAvailable, resourceId } from '../content/access.ts';
import type { Database } from '../db/index.ts';
import { gameSessions, gameCheckpointMap } from '../db/schema-phase4.ts';
import { concepts, conceptLadders, items, learningSessions, profiles } from '../db/schema.ts';
import { recordAnswer, mistakeFor } from '../learning/record.ts';
import { ApiException, parseInput } from '../errors.ts';

export const GAME_TITLES: Record<string, string> = {
  motion: 'Motion Lab', newton: "Newton's Laws", matter: 'Matter Lab', cell: 'Cell Explorer',
  float: 'Float or Sink', sound: 'Sound Lab', energy: 'Energy Lab', poly: 'Polynomial Workshop', graphs: 'Coordinate Graphs',
  atom: 'Atom Forge', 'maths-war': 'Maths War', circleverse: 'Circleverse',
  'force-series': 'FORCE: The Series', 'chotu-motion': 'Chotu ki Kahani: Motion',
  tinker: 'Tinker: The Knowledge Quest', 'quill-blade': 'Quill & Blade',
  'optics-lab': 'VidhyaSaathy Optics Lab', mixtures: 'Mixture Detective', tissues: 'Tissue Trail', linear: 'Line Builder',
};
export const GAME_EVIDENCE_WEIGHT = 0.5;
type Snapshot = { checkpoint_key: string; item_id: string; concept_id: string; chapter_id: string; content: string; response: string | null };

export function registerGamesRoutes(app: FastifyInstance, database: Database, now: () => number) {
  const { db, sqlite } = database;
  const student = { preHandler: requireRole('student') };
  app.get('/chapters/:id/game-progress', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const chapter = chapterAccess(db, request, resourceId(request));
    const completed = sqlite.prepare(`SELECT DISTINCT s.game_id FROM game_session s
      JOIN game_session_item i ON i.session_id=s.id
      WHERE s.school_id=? AND s.profile_id=? AND s.finished_at IS NOT NULL AND i.chapter_id=?`)
      .all(school.id, profile.id, chapter.id) as { game_id: string }[];
    const ideas = db.select().from(concepts).where(and(eq(concepts.schoolId, school.id), eq(concepts.chapterId, chapter.id))).all()
      .filter((row) => row.sourceClass == null || row.sourceClass >= 9);
    const ladders = db.select().from(conceptLadders).where(and(eq(conceptLadders.schoolId, school.id), eq(conceptLadders.profileId, profile.id))).all();
    const words = ['New', "Let's fix this", 'Almost there', 'Mastered', 'Top form'];
    const states = ideas.map((idea) => {
      const ladder = ladders.find((row) => row.conceptId === idea.id);
      return { conceptId: idea.id, title: idea.title, word: words[ladder?.masteryLevel ?? 0] ?? 'New' };
    });
    const fix = states.find((row) => row.word === "Let's fix this" || row.word === 'Almost there');
    return { chapterId: chapter.id, completedGames: completed.map((row) => row.game_id), playDone: completed.length > 0,
      next: completed.length ? fix ? 'fix' : 'master' : 'play', concepts: states,
      nextHref: fix ? `/student/concepts/${fix.conceptId}/remediation` : `/student/chapters/${chapter.id}/practice/chapter_progress_challenge` };
  });
  function game(request: FastifyRequest) {
    const { gameId, id } = request.params as { gameId: string; id?: string };
    if (!Object.hasOwn(GAME_TITLES, gameId)) throw new ApiException(404, 'NOT_FOUND', 'This game is not available.');
    return { gameId, id };
  }
  function session(request: FastifyRequest) {
    const { gameId, id } = game(request);
    const { school, profile } = requireAuth(request);
    const row = db.select().from(gameSessions).where(and(eq(gameSessions.id, id ?? ''), eq(gameSessions.gameId, gameId), eq(gameSessions.schoolId, school.id), eq(gameSessions.profileId, profile.id))).get();
    if (!row) throw new ApiException(404, 'NOT_FOUND', 'This game session is not available.');
    return row;
  }
  function replay<T>(request: FastifyRequest, clientEventId: string, input: unknown, work: () => T): T {
    const { school, profile } = requireAuth(request);
    const fingerprint = JSON.stringify([request.url, input]);
    return sqlite.transaction(() => {
      const previous = sqlite.prepare('SELECT request,response FROM game_event WHERE school_id=? AND profile_id=? AND client_event_id=?')
        .get(school.id, profile.id, clientEventId) as { request: string; response: string } | undefined;
      if (previous) {
        if (previous.request !== fingerprint) throw new ApiException(409, 'EVENT_CONFLICT', 'Use a new event ID for a different action.');
        return JSON.parse(previous.response) as T;
      }
      const response = work();
      sqlite.prepare('INSERT INTO game_event VALUES (?,?,?,?,?)').run(school.id, profile.id, clientEventId, fingerprint, JSON.stringify(response));
      return response;
    })();
  }
  function best(schoolId: string, profileId: string, gameId: string) {
    const row = sqlite.prepare('SELECT best_value,best_label FROM game_session WHERE school_id=? AND profile_id=? AND game_id=? AND finished_at IS NOT NULL AND best_value IS NOT NULL ORDER BY best_value DESC,finished_at LIMIT 1')
      .get(schoolId, profileId, gameId) as { best_value: number; best_label: string } | undefined;
    return row ? { kind: 'score' as const, value: row.best_value, label: row.best_label } : null;
  }

  app.post('/games/:gameId/sessions', student, async (request) => {
    const { gameId } = game(request);
    const input = parseInput(GameSessionStartSchema, request.body);
    return replay(request, input.clientEventId, input, (): GameSessionStartResponse => {
      const { school, profile } = requireAuth(request);
      const mappings = db.select().from(gameCheckpointMap).where(and(eq(gameCheckpointMap.schoolId, school.id), eq(gameCheckpointMap.gameId, gameId))).all();
      if (!mappings.length) throw new ApiException(503, 'BANK_UNAVAILABLE', 'Your teacher is preparing this game.');
      const selected = mappings.map((mapping) => {
        const item = db.select().from(items).where(and(eq(items.schoolId, school.id), eq(items.id, mapping.itemId), eq(items.conceptId, mapping.conceptId))).get();
        if (!item) throw new ApiException(503, 'BANK_UNAVAILABLE', 'This question is being prepared.');
        chapterAccess(db, request, item.chapterId);
        const sectionId = db.select().from(profiles).where(eq(profiles.id, profile.id)).get()?.sectionId;
        const released = db.select().from(learningSessions).where(and(eq(learningSessions.schoolId, school.id), eq(learningSessions.chapterId, item.chapterId), eq(learningSessions.sectionId, sectionId ?? ''))).all().some((row) => isAvailable(row, now()));
        if (!released) throw new ApiException(403, 'CONTENT_UNAVAILABLE', 'Finish the released lesson before playing.');
        const content = SaveItemSchema.parse(item.content);
        if (content.type !== 'mcq' || content.options.length > 4) throw new ApiException(503, 'BANK_UNAVAILABLE', 'This question is being prepared.');
        return { mapping, item, content };
      });
      const sessionId = randomUUID();
      db.insert(gameSessions).values({ id: sessionId, schoolId: school.id, profileId: profile.id, gameId, conceptId: selected[0]!.mapping.conceptId, startedAt: now() }).run();
      const checkpoints: GameSessionStartResponse['checkpoints'] = {};
      for (const { mapping, item, content } of selected) {
        sqlite.prepare('INSERT INTO game_session_item (session_id,checkpoint_key,item_id,concept_id,chapter_id,content) VALUES (?,?,?,?,?,?)')
          .run(sessionId, mapping.checkpointKey, item.id, item.conceptId, item.chapterId, JSON.stringify(content));
        // Shuffle the public choices; never expose an answer position pattern.
        const options = content.options.map((text) => ({ text, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ text }) => text);
        const snapshot = { ...content, options };
        sqlite.prepare('UPDATE game_session_item SET content=? WHERE session_id=? AND checkpoint_key=?').run(JSON.stringify(snapshot), sessionId, mapping.checkpointKey);
        checkpoints[mapping.checkpointKey] = { itemId: item.id, stem: content.prompt, options: options.map((text, index) => ({ id: String(index), text })), format: 'mcq', level: Math.min(3, content.difficulty) };
      }
      return { sessionId, checkpoints };
    });
  });

  app.post('/games/:gameId/sessions/:id/answer', student, async (request) => {
    const input = parseInput(GameAnswerSchema, request.body);
    return replay(request, input.clientEventId, input, (): GameAnswerResponse => {
      const row = session(request);
      if (row.finishedAt !== null) throw new ApiException(409, 'SESSION_FINISHED', 'This round has finished.');
      const snapshot = sqlite.prepare('SELECT * FROM game_session_item WHERE session_id=? AND checkpoint_key=?').get(row.id, input.checkpointKey) as Snapshot | undefined;
      if (!snapshot) throw new ApiException(404, 'NOT_FOUND', 'This checkpoint is not available.');
      if (snapshot.response) throw new ApiException(409, 'ALREADY_ANSWERED', 'This checkpoint has already been answered.');
      const content = SaveItemSchema.parse(JSON.parse(snapshot.content));
      if (content.type !== 'mcq' || !('optionId' in input.answer) || !/^[0-3]$/.test(input.answer.optionId) || !content.options[Number(input.answer.optionId)]) throw new ApiException(400, 'INVALID_ANSWER', 'Choose an offered answer.');
      const answer = content.options[Number(input.answer.optionId)]!;
      const correct = answer === content.answer;
      const feedback = recordAnswer(db, { id: `game:${row.id}:${input.checkpointKey}`, schoolId: row.schoolId, profileId: row.profileId, chapterId: snapshot.chapter_id, conceptId: snapshot.concept_id, itemId: snapshot.item_id, level: clampLevel(content.difficulty), correct, confidence: input.confidence, source: `game:${row.gameId}`, weight: GAME_EVIDENCE_WEIGHT, answer, timeMs: input.timeMs, ...mistakeFor(content, answer) }, now());
      const response: GameAnswerResponse = { correct, correctOptionId: String(content.options.indexOf(content.answer)), explanation: content.explanation || (correct ? 'Yes, that follows the idea.' : 'Look at this idea again before the next checkpoint.'), xp: xpFromEvidence([{ kind: 'answer', correct, confidence: input.confidence }]), ...(feedback.errorType ? { errorType: feedback.errorType } : {}) };
      sqlite.prepare('UPDATE game_session_item SET response=? WHERE session_id=? AND checkpoint_key=?').run(JSON.stringify(response), row.id, input.checkpointKey);
      sqlite.prepare('UPDATE game_session SET answered=answered+1,correct=correct+? WHERE id=?').run(correct ? 1 : 0, row.id);
      return response;
    });
  });

  app.post('/games/:gameId/sessions/:id/finish', student, async (request) => {
    const input = parseInput(GameFinishSchema, request.body);
    return replay(request, input.clientEventId, input, (): GameFinishResponse => {
      const row = session(request);
      const snapshots = sqlite.prepare('SELECT response FROM game_session_item WHERE session_id=?').all(row.id) as { response: string | null }[];
      if (!snapshots.length || snapshots.some((item) => !item.response)) throw new ApiException(409, 'ROUND_INCOMPLETE', 'Answer every checkpoint before finishing.');
      const previous = best(row.schoolId, row.profileId, row.gameId);
      const value = Math.round(100 * row.correct / row.answered);
      const label = `Best ${row.correct}/${row.answered}`;
      const personalBest = row.finishedAt === null && (!previous || value > previous.value);
      if (row.finishedAt === null) sqlite.prepare('UPDATE game_session SET finished_at=?,best_kind=?,best_value=?,best_label=? WHERE id=?').run(now(), 'score', value, label, row.id);
      return { answered: row.answered, correct: row.correct, personalBest, best: best(row.schoolId, row.profileId, row.gameId)!, xp: snapshots.reduce((sum, item) => sum + (JSON.parse(item.response!) as GameAnswerResponse).xp, 0) };
    });
  });
  app.get('/games/:gameId/best', student, async (request) => {
    const { gameId } = game(request);
    const { school, profile } = requireAuth(request);
    const concept = sqlite.prepare(`SELECT c.title FROM game_checkpoint_map m JOIN concept c ON c.id=m.concept_id
      WHERE m.school_id=? AND m.game_id=? ORDER BY m.checkpoint_key LIMIT 1`).get(school.id, gameId) as { title: string } | undefined;
    return { best: best(school.id, profile.id, gameId), conceptName: concept?.title ?? '' };
  });
}
