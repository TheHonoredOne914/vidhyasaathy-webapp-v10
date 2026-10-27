import { z } from 'zod';
import { AnswerSchema } from './assessment.ts';
import { PublicItemSchema, SaveItemSchema, SaveSlideSchema } from './content.ts';

const Id = z.string().uuid();
const Timestamp = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const AskSchema = z.object({
  chapterId: Id, question: z.string().trim().min(2).max(1000),
  hintLevel: z.number().int().min(1).max(3).default(1), socratic: z.boolean().default(false),
}).strict();
export const NoteCitationSchema = z.object({
  noteId: Id, title: z.string(), locator: z.string(), quote: z.string().min(1),
}).strict();
export const AskResponseSchema = z.object({
  status: z.enum(['answered', 'not_in_notes', 'not_configured', 'unavailable']),
  message: z.string(), hintLevel: z.number().int().min(1).max(3), socratic: z.boolean(),
  citations: z.array(NoteCitationSchema), cached: z.boolean(), updatedAt: Timestamp,
}).strict();

// Provider output is never published directly. Approval creates ordinary editable drafts.
export const AiDraftSchema = z.object({
  title: z.string().trim().min(1).max(160), slides: z.array(SaveSlideSchema).min(1).max(20),
  check: z.array(SaveItemSchema).min(2).max(20),
}).strict();
export const CreateDraftJobSchema = z.object({ noteId: Id, sectionId: Id }).strict();
export const ReviewDraftJobSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve'), draft: AiDraftSchema, dueAt: Timestamp }).strict(),
  z.object({ decision: z.literal('reject') }).strict(),
]);
export const DraftJobSchema = z.object({
  id: Id, schoolId: Id, noteId: Id, sectionId: Id,
  status: z.enum(['queued', 'running', 'ready', 'not_configured', 'failed', 'approved', 'rejected']),
  message: z.string().nullable(), draft: AiDraftSchema.nullable(),
  sessionId: Id.nullable(), assignmentId: Id.nullable(),
  createdAt: Timestamp, updatedAt: Timestamp,
}).strict();

export const RemediationSchema = z.object({
  conceptId: Id, targetConceptId: Id, title: z.string(),
  status: z.enum(['not_needed', 'ready', 'needs_teacher_material', 'passed']),
  lesson: z.object({ body: z.string(), citation: NoteCitationSchema }).strict().nullable(),
  check: z.array(PublicItemSchema).max(2), checkAttempts: z.number().int().nonnegative(),
  passedOnSecondAttempt: z.boolean(), updatedAt: Timestamp,
}).strict();
export const SubmitRemediationSchema = z.object({
  clientEventId: Id,
  answers: z.array(z.object({ itemId: Id, answer: AnswerSchema }).strict()).length(2)
    .refine((answers) => answers[0]?.itemId !== answers[1]?.itemId, 'Answer two different questions.'),
}).strict();
export const RemediationResultSchema = z.object({
  clientEventId: Id, conceptId: Id, targetConceptId: Id, correct: z.number().int().min(0).max(2),
  passed: z.boolean(), checkAttempt: z.number().int().positive(), passedOnSecondAttempt: z.boolean(), updatedAt: Timestamp,
}).strict();
export const ConceptGapSchema = z.object({
  conceptId: Id, targetConceptId: Id, depth: z.number().int().nonnegative(),
  evidence: z.number().int().nonnegative(), minimumEvidence: z.number().int().positive(),
}).strict();
export const PlanItemSchema = z.object({
  id: Id, chapterId: Id, title: z.string(), kind: z.enum(['assignment', 'session', 'remediation', 'review']),
  required: z.boolean(), dueAt: Timestamp.nullable(), resumeAt: z.number().int().nonnegative(),
}).strict();
export const StudyPlanSchema = z.object({
  items: z.array(PlanItemSchema), nextAction: PlanItemSchema.nullable(), continue: PlanItemSchema.nullable(), updatedAt: Timestamp,
}).strict();

export type Ask = z.infer<typeof AskSchema>;
export type AskResponse = z.infer<typeof AskResponseSchema>;
export type NoteCitation = z.infer<typeof NoteCitationSchema>;
export type AiDraft = z.infer<typeof AiDraftSchema>;
export type DraftJob = z.infer<typeof DraftJobSchema>;
export type Remediation = z.infer<typeof RemediationSchema>;
export type RemediationResult = z.infer<typeof RemediationResultSchema>;
export type PlanItem = z.infer<typeof PlanItemSchema>;
export type StudyPlan = z.infer<typeof StudyPlanSchema>;
