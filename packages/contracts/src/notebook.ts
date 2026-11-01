import { z } from 'zod';
import { MasteryWordSchema } from './dashboard.ts';

const Id = z.string().uuid();
const Count = z.number().int().nonnegative();
const Goal = z.object({ done: Count, total: Count }).strict();
export const ConceptStationSchema = z.object({
  conceptId: Id, title: z.string(), word: MasteryWordSchema,
  status: z.enum(['done', 'current', 'next', 'locked']), lockReason: z.string().nullable(),
}).strict();
export const SubjectPathSchema = z.object({
  subjectId: Id, name: z.string(), nextUp: ConceptStationSchema.nullable(),
  chapters: z.array(z.object({
    chapterId: Id, title: z.string(), lockReason: z.string().nullable(), stations: z.array(ConceptStationSchema),
    goal: Goal, atAGlance: z.array(z.object({ word: MasteryWordSchema, count: Count }).strict()), nextUp: ConceptStationSchema.nullable(),
  }).strict()),
}).strict();
const SubjectCardSchema = z.object({
  subjectId: Id, name: z.string(), done: Count, total: Count,
  masteryPercent: z.number().int().min(0).max(100), word: MasteryWordSchema, nextIdea: ConceptStationSchema.nullable(), weekMinutes: Count,
  due: z.object({ assignmentId: Id, title: z.string(), dueAt: Count, state: z.enum(['due', 'overdue']) }).strict().nullable(),
}).strict();
export const SubjectsBoardSchema = z.object({ subjects: z.array(SubjectCardSchema) }).strict();
export const NotebookProgressSchema = SubjectsBoardSchema.extend({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  calendar: z.array(z.object({ day: z.string().date(), studied: z.boolean(), frozen: z.boolean() }).strict()),
  ideasToLookAt: z.array(z.object({ conceptId: Id, title: z.string(), word: MasteryWordSchema }).strict()),
  week: z.array(z.object({ day: z.string().date(), minutes: Count }).strict()).length(7),
  confidence: z.array(z.object({ confidence: z.enum(['sure', 'unsure', 'guess']), answers: Count,
    accuracyPercent: z.number().int().min(0).max(100).nullable() }).strict()).length(3),
  wins: z.array(z.object({ id: z.string(), title: z.string(), awardedAt: Count }).strict()),
}).strict();

export const LearningPreferencesSchema = z.object({
  style: z.enum(['notes', 'story', 'diagram', 'exam']).default('notes'),
  whenStuck: z.enum(['hint', 'example', 'simpler']).default('hint'),
  questionsPerSet: z.number().int().min(3).max(10).default(5),
  dailyGoalMinutes: z.number().int().min(5).max(60).default(20),
  reminder: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),
  biggerText: z.boolean().default(false), plainFont: z.boolean().default(false),
  reduceMotion: z.boolean().default(false), language: z.enum(['en', 'hi']).default('en'),
}).strict();
export type LearningPreferences = z.infer<typeof LearningPreferencesSchema>;
