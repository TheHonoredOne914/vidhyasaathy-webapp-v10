import { z } from 'zod';
import { getJson, postJson } from '../api/client';

export const BestSchema = z.object({ kind: z.enum(['time', 'stars', 'score']), value: z.number(), label: z.string() });
export const GamesSchema = z.object({
  atomForge: z.object({ status: z.literal('ready'), label: z.string(), href: z.string() }).optional(),
  subjects: z.array(z.object({ id: z.string(), name: z.string(), count: z.number() })), total: z.number(),
  todaysGame: z.object({ gameId: z.string(), title: z.string(), blurb: z.string(), conceptName: z.string(), lessonNote: z.string(), estMinutes: z.number(), href: z.string() }).nullable(),
  games: z.array(z.object({
    gameId: z.string(), title: z.string(), subjectId: z.string(), subjectName: z.string(), topic: z.string(), chapterId: z.string(), href: z.string(),
    state: z.enum(['today', 'new', 'played', 'opens_later', 'paused']), opensAfter: z.string().optional(), chapterLabel: z.string().optional(), best: BestSchema.optional(),
  })),
});
export const CheckpointItemSchema = z.object({
  itemId: z.string(), stem: z.string(), options: z.array(z.object({ id: z.string(), text: z.string() })).optional(), format: z.string(),
}).transform((value) => ({ ...value, options: value.options ?? [] }));
export const SessionSchema = z.object({ sessionId: z.string(), checkpoints: z.record(CheckpointItemSchema) });
export const GameAnswerSchema = z.object({
  correct: z.boolean(), correctOptionId: z.string().optional(), explanation: z.string(), misconceptionNote: z.string().optional(), errorType: z.string().optional(), xp: z.number(),
});
export const FinishSchema = z.object({ answered: z.number(), correct: z.number(), personalBest: z.boolean(), best: BestSchema, xp: z.number() });
export const GameBestSchema = z.object({ best: BestSchema.nullable(), conceptName: z.string() });
export type GameSession = z.infer<typeof SessionSchema>;
export type GameItem = GameSession['checkpoints'][string];
export type GameAnswerResult = z.infer<typeof GameAnswerSchema>;
export type GameFinish = z.infer<typeof FinishSchema>;
export type GameBest = z.infer<typeof GameBestSchema>;
export type GameAnswer = { optionId: string } | { numeric: number; unit?: string } | { text: string };
export type GameSubmission = {
  clientEventId: string; checkpointKey: string; answer: GameAnswer; confidence: 'sure' | 'unsure' | 'guess'; timeMs: number; syncedLate?: boolean;
};
const path = (gameId: string) => `/games/${encodeURIComponent(gameId)}`;
export const startSession = (gameId: string, clientEventId: string, signal?: AbortSignal): Promise<GameSession> => postJson(`${path(gameId)}/sessions`, SessionSchema, { clientEventId }, signal);
export const submitAnswer = (gameId: string, sessionId: string, body: GameSubmission, signal?: AbortSignal) => postJson(`${path(gameId)}/sessions/${encodeURIComponent(sessionId)}/answer`, GameAnswerSchema, body, signal);
export const finishSession = (gameId: string, sessionId: string, clientEventId: string, signal?: AbortSignal) => postJson(`${path(gameId)}/sessions/${encodeURIComponent(sessionId)}/finish`, FinishSchema, { clientEventId }, signal);
export const getBest = (gameId: string, signal?: AbortSignal) => getJson(`${path(gameId)}/best`, GameBestSchema, signal);
