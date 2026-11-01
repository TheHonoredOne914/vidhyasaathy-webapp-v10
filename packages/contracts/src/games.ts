import { z } from 'zod';

export const GameSessionStartSchema = z.object({
  clientEventId: z.string().min(1).max(100),
}).strict();

export const GameAnswerSchema = z.object({
  clientEventId: z.string().min(1).max(100),
  checkpointKey: z.string().min(1).max(100),
  answer: z.union([
    z.object({ optionId: z.string().min(1).max(100) }),
    z.object({ numeric: z.number(), unit: z.string().optional() }),
    z.object({ text: z.string().min(1).max(200) }),
  ]),
  confidence: z.enum(['sure', 'unsure', 'guess']),
  timeMs: z.number().int().min(0).max(300000),
  syncedLate: z.boolean().optional(),
}).strict();

export const GameFinishSchema = z.object({
  clientEventId: z.string().min(1).max(100),
}).strict();

export const GameCheckpointSchema = z.object({
  itemId: z.string().min(1).max(100),
  stem: z.string().min(1).max(800),
  options: z.array(z.object({ id: z.string().min(1).max(100), text: z.string().min(1).max(200) })).min(2).max(4),
  format: z.enum(['mcq', 'numeric', 'text']),
  level: z.number().int().min(1).max(3),
}).strict();

export const GameSessionStartResponseSchema = z.object({
  sessionId: z.string().min(1).max(100),
  checkpoints: z.record(z.string(), GameCheckpointSchema),
}).strict();

export const GameAnswerResponseSchema = z.object({
  correct: z.boolean(),
  correctOptionId: z.string().optional(),
  explanation: z.string().min(1).max(800),
  misconceptionNote: z.string().optional(),
  errorType: z.enum(['concept_gap', 'careless', 'method', 'guess']).optional(),
  xp: z.number().int().min(0),
}).strict();

export const GameFinishResponseSchema = z.object({
  answered: z.number().int().min(0),
  correct: z.number().int().min(0),
  personalBest: z.boolean(),
  best: z.object({
    kind: z.enum(['time', 'stars', 'score']),
    value: z.number(),
    label: z.string(),
  }),
  xp: z.number().int().min(0),
}).strict();

export const GameBestResponseSchema = z.object({
  best: z.object({
    kind: z.enum(['time', 'stars', 'score']),
    value: z.number(),
    label: z.string(),
  }).nullable(),
  conceptName: z.string().optional(),
}).strict();

export const GamesBoardSchema = z.object({
  subjects: z.array(z.object({
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(60),
    count: z.number().int().min(0),
  })),
  total: z.number().int().min(0),
  todaysGame: z.object({
    gameId: z.string().min(1).max(100),
    title: z.string().min(1).max(60),
    blurb: z.string().min(1).max(200),
    conceptName: z.string().min(1).max(60),
    lessonNote: z.string().min(1).max(200),
    estMinutes: z.number().int().min(1).max(30),
    href: z.string().min(1).max(200),
  }).nullable(),
  games: z.array(z.object({
    gameId: z.string().min(1).max(100),
    title: z.string().min(1).max(60),
    subjectId: z.string().min(1).max(100),
    subjectName: z.string().min(1).max(60),
    topic: z.string().min(1).max(120),
    chapterId: z.string().min(1).max(100),
    href: z.string().min(1).max(200),
    state: z.enum(['today', 'new', 'played', 'opens_later', 'paused']),
    opensAfter: z.string().optional(),
    chapterLabel: z.string().optional(),
    best: z.object({
      kind: z.enum(['time', 'stars', 'score']),
      value: z.number(),
      label: z.string(),
    }).optional(),
  })),
});

export type GameSessionStart = z.infer<typeof GameSessionStartSchema>;
export type GameAnswer = z.infer<typeof GameAnswerSchema>;
export type GameFinish = z.infer<typeof GameFinishSchema>;
export type GameCheckpoint = z.infer<typeof GameCheckpointSchema>;
export type GameSessionStartResponse = z.infer<typeof GameSessionStartResponseSchema>;
export type GameAnswerResponse = z.infer<typeof GameAnswerResponseSchema>;
export type GameFinishResponse = z.infer<typeof GameFinishResponseSchema>;
export type GameBestResponse = z.infer<typeof GameBestResponseSchema>;
export type GamesBoard = z.infer<typeof GamesBoardSchema>;
