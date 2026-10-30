import { z } from 'zod';
import { ContentStatusSchema, PublicItemSchema, SaveItemSchema } from './content.ts';

const Id = z.string().uuid();
const Timestamp = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const AnswerSchema = z.union([
  z.string().trim().min(1).max(1000), z.array(z.string().trim().min(1).max(1000)).min(2).max(12),
]);
export const BankItemSchema = z.object({ id: Id, schoolId: Id, chapterId: Id, content: SaveItemSchema }).strict();
export const SaveAssignmentSchema = z.object({
  sectionId: Id, title: z.string().trim().min(1).max(160), kind: z.enum(['homework', 'quiz']),
  dueAt: Timestamp,
  itemIds: z.array(Id).min(1).max(100).refine((ids) => new Set(ids).size === ids.length, 'Remove duplicate items.'),
}).strict();
export const AssignmentScoreSchema = z.object({
  answered: z.number().int().nonnegative(), marked: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(), total: z.number().int().positive(),
  status: z.enum(['not_started', 'in_progress', 'pending_review', 'completed']),
}).strict();
export const AssignmentSchema = SaveAssignmentSchema.extend({
  id: Id, schoolId: Id, chapterId: Id, teacherId: Id, teacherName: z.string(), required: z.literal(true),
  status: ContentStatusSchema, publishedAt: Timestamp.nullable(), updatedAt: Timestamp,
  lateUntil: Timestamp.nullable(),
  score: AssignmentScoreSchema.nullable(),
}).strict();
export const AssignmentDetailSchema = AssignmentSchema.extend({
  items: z.array(z.union([BankItemSchema, PublicItemSchema])),
}).strict();
export const AssignmentQuerySchema = z.object({ chapterId: Id.optional(), sectionId: Id.optional() }).strict();
export const PublishAssignmentSchema = z.object({}).strict();
export const SubmitAttemptSchema = z.object({
  clientEventId: Id, assignmentId: Id, itemId: Id, answer: AnswerSchema,
  timeMs: z.number().int().nonnegative().max(86400000), clientTs: Timestamp,
  confidence: z.enum(['sure', 'unsure', 'guess']).optional(),
}).strict();
export const AttemptSchema = SubmitAttemptSchema.extend({
  id: Id, schoolId: Id, profileId: Id, conceptId: Id, correct: z.boolean().nullable(),
  needsReview: z.boolean(), serverTs: Timestamp, updatedAt: Timestamp,
  gradedBy: Id.nullable(), gradedAt: Timestamp.nullable(),
}).strict();
export const GradeAttemptSchema = z.object({ correct: z.boolean() }).strict();
export const ReviewQuerySchema = z.object({ assignmentId: Id.optional(), pendingOnly: z.enum(['true', 'false']).default('true') }).strict();
export const StudentConceptStateSchema = z.object({
  schoolId: Id, profileId: Id, conceptId: Id, mastery: z.number().min(0).max(1),
  leitnerBox: z.number().int().min(1).max(5), nextReview: Timestamp,
  attempts: z.number().int().nonnegative(), updatedAt: Timestamp,
}).strict();
const Cursor = z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0);
export const SyncQuerySchema = z.object({
  assignments: Cursor, items: Cursor, attempts: Cursor, conceptStates: Cursor,
  limit: z.coerce.number().int().min(1).max(200).default(100),
}).strict();
export const SyncCursorsSchema = z.object({ assignments: Timestamp, items: Timestamp, attempts: Timestamp, conceptStates: Timestamp }).strict();
export const SyncResponseSchema = z.object({
  updatedAt: Timestamp, cursors: SyncCursorsSchema,
  hasMore: z.object({ assignments: z.boolean(), items: z.boolean(), attempts: z.boolean(), conceptStates: z.boolean() }).strict(),
  assignments: z.array(AssignmentSchema), items: z.array(PublicItemSchema),
  attempts: z.array(AttemptSchema), conceptStates: z.array(StudentConceptStateSchema),
}).strict();
export const PushAttemptsSchema = z.object({ attempts: z.array(SubmitAttemptSchema).min(1).max(100) }).strict();
export const PushAttemptsResponseSchema = z.object({ attempts: z.array(AttemptSchema) }).strict();

export type Answer = z.infer<typeof AnswerSchema>;
export type SaveAssignment = z.infer<typeof SaveAssignmentSchema>;
export type SubmitAttempt = z.infer<typeof SubmitAttemptSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type StudentConceptState = z.infer<typeof StudentConceptStateSchema>;
export type SyncCursors = z.infer<typeof SyncCursorsSchema>;
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
