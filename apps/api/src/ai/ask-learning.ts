import type { AskStreamInput } from '@vidhyasaathy/contracts';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import { chapterAccess } from '../content/access.ts';
import type { Database } from '../db/index.ts';
import { ApiException } from '../errors.ts';
import { moduleBank } from '../learning/proto-content.ts';
import { sessionPlan, type StudySession } from '../learning/proto-store.ts';
import { MODE_PROMPTS } from '../learning/proto-tutor.ts';

export function askTeachingInstruction(mode: AskStreamInput['teachingMode']) {
  if (!mode) return '';
  if (mode === 'example') return 'Show one worked example grounded in the current idea, then invite a similar attempt.';
  if (mode === 'quiz_me') return 'Ask one short question about the current idea, without revealing its answer.';
  if (mode === 'step_by_step') return 'Break the current idea into small numbered steps, checking understanding before moving on.';
  if (mode === 'real_life') return 'Connect the current idea to one familiar everyday situation with explicit correspondences.';
  return MODE_PROMPTS[mode];
}

export function askLearningContext(database: Database, request: FastifyRequest, sessionId?: string) {
  if (!sessionId) return null;
  const { school, profile } = requireAuth(request);
  const row = database.sqlite.prepare('SELECT * FROM proto_study_session WHERE id=? AND school_id=? AND profile_id=?').get(sessionId, school.id, profile.id) as StudySession | undefined;
  if (!row) throw new ApiException(404, 'NOT_FOUND', 'This learning session is not available.');
  const chapter = chapterAccess(database.db, request, row.chapter_id);
  const plan = sessionPlan(row);
  const module = moduleBank(database.db, school.id, chapter).modules.find((item) => item.id === plan.steps[plan.currentStep]?.moduleId);
  const recent = database.sqlite.prepare('SELECT type,result FROM proto_learning_event WHERE session_id=? ORDER BY ts DESC,rowid DESC LIMIT 100').all(row.id) as { type: string; result: string }[];
  const wrong = recent.find((event) => event.type === 'answer_submitted' && JSON.parse(event.result).correct === false);
  const game = recent.find((event) => event.type === 'activity_finished');
  return { chapterId: chapter.id, context: JSON.stringify({ stepTitle: module?.objective ?? 'Chapter complete', moduleType: module?.type ?? 'revision', conceptId: module?.conceptId,
    lastWrongAnswer: wrong ? JSON.parse(wrong.result) : null, lastGameResult: game ? JSON.parse(game.result) : null }) };
}
