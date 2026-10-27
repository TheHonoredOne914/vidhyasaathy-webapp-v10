import { z } from 'zod';
import { AttemptSchema, SubmitAttemptSchema } from './assessment.ts';
import { PublicItemSchema } from './content.ts';

export const GameIdSchema = z.enum([
  'timed_concept_challenge', 'mcq_rush', 'quick_revision_quiz', 'match_the_concept', 'chapter_progress_challenge',
]);
export const PracticeQuerySchema = z.object({
  gameId: GameIdSchema.default('quick_revision_quiz'), limit: z.coerce.number().int().min(1).max(30).default(6),
}).strict();
export const PracticeSetSchema = z.object({
  chapterId: z.string().uuid(), gameId: GameIdSchema, required: z.literal(false), updatedAt: z.number().int().nonnegative(),
  items: z.array(z.object({ item: PublicItemSchema, kind: z.enum(['new', 'review']) }).strict()),
}).strict();
// Games emit the same answer event as assignments, without an assignment/deadline.
export const SubmitPracticeAttemptSchema = SubmitAttemptSchema.omit({ assignmentId: true });
export const PracticeAttemptSchema = AttemptSchema.omit({ assignmentId: true }).extend({ assignmentId: z.null() }).strict();
export const StreakSchema = z.object({
  timezone: z.literal('Asia/Kolkata'), currentDays: z.number().int().nonnegative(), longestDays: z.number().int().nonnegative(),
  lastPracticedOn: z.string().date().nullable(), updatedAt: z.number().int().nonnegative(),
  days: z.array(z.object({ date: z.string().date(), practiced: z.boolean() }).strict()).length(7),
}).strict();
export type GameId = z.infer<typeof GameIdSchema>;
export type PracticeSet = z.infer<typeof PracticeSetSchema>;
export type SubmitPracticeAttempt = z.infer<typeof SubmitPracticeAttemptSchema>;
export type PracticeAttempt = z.infer<typeof PracticeAttemptSchema>;
export type Streak = z.infer<typeof StreakSchema>;
