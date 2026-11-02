import { z } from 'zod';

export const StatusWordSchema = z.enum(['New', "Let's fix this", 'Almost there', 'Mastered', 'Top form']);
export type StatusWord = z.infer<typeof StatusWordSchema>;
export const TodayActionSchema = z.object({
  kind: z.enum(['continue_session', 'start_chapter', 'fix', 'revise', 'homework', 'catchup', 'play']),
  title: z.string(), subtitle: z.string(), href: z.string().startsWith('/student'), estMinutes: z.number(),
  chapterId: z.string().optional(), conceptId: z.string().optional(), sessionId: z.string().optional(), activityId: z.string().optional(), status: StatusWordSchema.optional(),
});
export const TodayPlanSchema = z.object({ date: z.string(), greeting: z.string(), primary: TodayActionSchema, next: z.array(TodayActionSchema).max(3), streakDays: z.number(), source: z.enum(['live', 'mock']) });
export type TodayPlan = z.infer<typeof TodayPlanSchema>;

export const ChapterWorldSchema = z.object({
  chapterId: z.string(), title: z.string(), subjectName: z.string(),
  stops: z.array(z.object({ key: z.enum(['explore', 'learn', 'try', 'fix', 'play', 'master']), title: z.string(), state: z.enum(['locked', 'open', 'done']), href: z.string().startsWith('/student/'), detail: z.string() })),
  concepts: z.array(z.object({ conceptId: z.string(), name: z.string(), word: StatusWordSchema })),
  games: z.array(z.object({ id: z.string(), title: z.string(), href: z.string().startsWith('/student/') })),
  sessionId: z.string().nullable(), source: z.enum(['live', 'mock']),
});
export type ChapterWorld = z.infer<typeof ChapterWorldSchema>;
