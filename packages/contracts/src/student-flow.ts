import { z } from 'zod';

export const DiagnosticSkipSchema = z.object({}).strict();
export const DiagnosticSkipResultSchema = z.object({ offered: z.literal(false), nextOfferAt: z.string().datetime() });

export const StatusWordSchema = z.enum(['New', "Let's fix this", 'Almost there', 'Mastered', 'Top form']);
export type StatusWord = z.infer<typeof StatusWordSchema>;
export const TodayActionSchema = z.object({
  kind: z.enum(['continue_session', 'start_chapter', 'fix', 'revise', 'homework', 'catchup', 'play']),
  title: z.string(), subtitle: z.string(), href: z.string().startsWith('/student/'), estMinutes: z.number().int().positive(),
  chapterId: z.string().optional(), conceptId: z.string().optional(), sessionId: z.string().optional(), activityId: z.string().optional(),
  status: StatusWordSchema.optional(),
});
export type TodayAction = z.infer<typeof TodayActionSchema>;
export const TodayPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), greeting: z.string(), primary: TodayActionSchema,
  next: TodayActionSchema.array().max(3), streakDays: z.number().int().nonnegative(), source: z.enum(['live', 'mock']),
});
export type TodayPlan = z.infer<typeof TodayPlanSchema>;
