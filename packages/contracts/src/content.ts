import { z } from 'zod';

const Id = z.string().uuid();
const Title = z.string().trim().min(1).max(160);
const Body = z.string().trim().min(1).max(20000);
const Position = z.number().int().min(0).max(1000);
const Ids = z.array(Id).max(100).refine((ids) => new Set(ids).size === ids.length, 'Remove duplicate IDs.');
const Scoped = z.object({ id: Id, schoolId: Id });
export const ContentStatusSchema = z.enum(['draft', 'published']);
export const ChapterStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

export const SaveChapterSchema = z.object({ subjectId: Id, title: Title, position: Position }).strict();
export const ChapterSchema = Scoped.merge(SaveChapterSchema).extend({ status: ChapterStatusSchema }).strict();
export const SaveConceptSchema = z.object({ title: Title, description: z.string().trim().max(2000), prerequisiteIds: Ids }).strict();
export const ConceptSchema = Scoped.extend({ chapterId: Id }).merge(SaveConceptSchema).strict();

export const ResourceTypeSchema = z.enum(['pdf', 'ppt', 'image', 'youtube', 'recording']);
export const SaveNoteSchema = z.object({ title: Title, body: Body, conceptIds: Ids, type: ResourceTypeSchema.default('pdf'), startSec: z.number().int().nonnegative().nullable().default(null), endSec: z.number().int().positive().nullable().default(null) }).strict();
export const NoteSchema = Scoped.extend({
  chapterId: Id, title: Title, body: Body, conceptIds: Ids,
  status: ContentStatusSchema, releaseAt: z.number().int().nonnegative().nullable(),
  updatedAt: z.number().int().nonnegative(),
  file: z.object({ filename: z.string(), contentType: z.string(), size: z.number().int().positive() }).strict().nullable(),
  type: ResourceTypeSchema, startSec: z.number().int().nonnegative().nullable(), endSec: z.number().int().positive().nullable(),
}).strict();

// Reversible local-storage default: 10 MiB, JSON/base64 transport, no active content.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UploadFileSchema = z.object({
  filename: z.string().min(1).max(160).regex(/^[^<>:"/\\|?*]+$/).refine((value) =>
    !value.includes('..') && [...value].every((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127), 'Use a plain filename.'),
  contentType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  dataBase64: z.string().min(4).max(4 * Math.ceil(MAX_UPLOAD_BYTES / 3)).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();
export const PublishContentSchema = z.object({ releaseAt: z.number().int().nonnegative().nullable().default(null) }).strict();

export const ErrorFamilySchema = z.enum(['concept_gap', 'careless', 'method', 'guess']);
const ItemBase = z.object({
  conceptId: Id, prompt: Title, difficulty: z.number().int().min(1).max(5),
  sourceRef: z.object({ noteId: Id, locator: Title }).strict().nullable(),
  explanation: z.string().trim().min(1).max(500).optional(),
  role: z.enum(['check', 'practice', 'diagnostic']).optional(),
});
const Option = z.string().trim().min(1).max(1000);
const Mcq = ItemBase.extend({
  type: z.literal('mcq'), options: z.array(Option).min(2).max(8), answer: Option,
  mistakes: z.array(z.object({ option: Option, errorType: ErrorFamilySchema, explanation: z.string().trim().min(1).max(500) }).strict()).max(8).optional(),
}).strict();
const Match = ItemBase.extend({
  type: z.literal('match_pairs'), pairs: z.array(z.object({ left: Option, right: Option }).strict()).min(2).max(12),
}).strict();
const Short = ItemBase.extend({ type: z.literal('short_answer'), acceptedAnswers: z.array(Option).min(1).max(20) }).strict();
const Flashcard = ItemBase.extend({ type: z.literal('flashcard'), answer: Option }).strict();
export const SaveItemSchema = z.discriminatedUnion('type', [Mcq, Match, Short, Flashcard]).superRefine((item, ctx) => {
  if (item.type === 'mcq' && (!item.options.includes(item.answer) || new Set(item.options).size !== item.options.length)) {
    ctx.addIssue({ code: 'custom', path: ['answer'], message: 'Use distinct options and an answer from those options.' });
  }
  if (item.type === 'match_pairs' && (new Set(item.pairs.map((pair) => pair.left)).size !== item.pairs.length
    || new Set(item.pairs.map((pair) => pair.right)).size !== item.pairs.length)) {
    ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'Use distinct left and right values.' });
  }
});
export const ItemSchema = z.object({ id: Id, sessionId: Id, position: Position, content: SaveItemSchema }).strict();
const PublicBase = ItemBase.extend({ id: Id, position: Position });
export const PublicItemSchema = z.discriminatedUnion('type', [
  PublicBase.extend({ type: z.literal('mcq'), options: z.array(Option) }).strict(),
  PublicBase.extend({ type: z.literal('match_pairs'), left: z.array(Option), right: z.array(Option) }).strict(),
  PublicBase.extend({ type: z.literal('short_answer') }).strict(),
  PublicBase.extend({ type: z.literal('flashcard') }).strict(),
]);

export const SaveSlideSchema = z.object({ conceptId: Id, title: Title, body: Body, noteId: Id.nullable() }).strict();
export const SlideSchema = SaveSlideSchema.extend({ id: Id, position: Position }).strict();
export const SaveLearningSessionSchema = z.object({
  sectionId: Id, title: Title, slides: z.array(SaveSlideSchema).min(1).max(100), check: z.array(SaveItemSchema).min(1).max(20),
}).strict();
export const SessionProgressSchema = z.object({
  viewedSlides: z.number().int().nonnegative(), totalSlides: z.number().int().positive(),
  checkAvailable: z.boolean(), completed: z.boolean(),
}).strict();
export const LearningSessionSummarySchema = Scoped.extend({
  chapterId: Id, sectionId: Id, title: Title, status: ContentStatusSchema,
  releaseAt: z.number().int().nonnegative().nullable(), updatedAt: z.number().int().nonnegative(),
  progress: SessionProgressSchema.nullable(),
}).strict();
export const CheckMissSchema = z.object({
  itemId: Id, prompt: z.string(), explanation: z.string(), errorType: ErrorFamilySchema,
}).strict();
export const CheckReviewSchema = z.object({
  score: z.number().min(0).max(1), passed: z.boolean(), bridge: z.string().nullable(), misses: z.array(CheckMissSchema),
}).strict();
export const LearningSessionSchema = LearningSessionSummarySchema.extend({
  slides: z.array(SlideSchema), check: z.array(z.union([ItemSchema, PublicItemSchema])),
  review: CheckReviewSchema.optional(),
}).strict();
export const AdvanceSessionSchema = z.object({ slideId: Id }).strict();
export const SubmitSessionCheckSchema = z.object({
  answers: z.array(z.object({
    itemId: Id, answer: z.union([Option, z.array(Option).min(2).max(12)]),
    confidence: z.enum(['sure', 'unsure', 'guess']).optional(),
    timeMs: z.number().int().nonnegative().max(86400000).optional(),
  }).strict()).min(1).max(20),
}).strict();
export const DiagnosticOfferSchema = z.object({
  chapterId: Id, offered: z.boolean(), title: z.string(), questions: z.array(PublicItemSchema),
}).strict();
export const SubmitDiagnosticSchema = z.object({
  answers: z.array(z.object({
    itemId: Id, answer: z.union([Option, z.array(Option).min(2).max(12)]),
    confidence: z.enum(['sure', 'unsure', 'guess']),
    timeMs: z.number().int().nonnegative().max(86400000).default(0),
  }).strict()).min(1).max(8),
}).strict();
export const DiagnosticResultSchema = z.object({
  chapterId: Id, route: z.enum(['challenge', 'steady', 'repair']), word: z.string(), message: z.string(),
}).strict();

export type SaveItem = z.infer<typeof SaveItemSchema>;
export type SaveLearningSession = z.infer<typeof SaveLearningSessionSchema>;
export type SessionProgress = z.infer<typeof SessionProgressSchema>;
export type PublicItem = z.infer<typeof PublicItemSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type LearningSession = z.infer<typeof LearningSessionSchema>;
