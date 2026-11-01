import { z } from 'zod';

const Id = z.string().uuid();
const Line = z.string().trim().min(1).max(500);
const NoteBody = z.string().trim().min(1).max(4000);
const Short = z.string().trim().min(1).max(80);

const close = (actual: number, expected: number) => Math.abs(actual - expected) <= 1e-6 * Math.max(1, Math.abs(expected));

export const NoteVariantSchema = z.enum(['simple', 'standard', 'stretch']);
export type NoteVariant = z.infer<typeof NoteVariantSchema>;

const SliderBase = z.object({
  kind: z.literal('slider_graph'),
  title: Line,
  axis: z.enum(['distance-time', 'velocity-time']),
  u: z.number().finite(),
  v: z.number().finite(),
  t: z.number().positive().finite(),
  a: z.number().finite(),
}).strict();
const MovingBase = z.object({
  kind: z.literal('moving_object'),
  title: Line,
  vehicle: z.enum(['car', 'ball', 'auto-rickshaw']),
  distance: z.number().nonnegative().finite(),
  time: z.number().positive().finite(),
  speed: z.number().nonnegative().finite(),
}).strict();
const LabelBit = z.object({ id: z.string().trim().min(1).max(40), text: Short }).strict();
const DragBase = z.object({
  kind: z.literal('drag_label'),
  title: Line,
  prompt: Line,
  labels: z.array(LabelBit).min(2).max(6),
  targets: z.array(LabelBit).min(2).max(6),
  pairs: z.array(z.object({ labelId: z.string().min(1).max(40), targetId: z.string().min(1).max(40) }).strict()).min(2).max(6),
  fix: Line,
}).strict();
const PredictBase = z.object({
  kind: z.literal('predict_reveal'),
  title: Line,
  prompt: Line,
  choices: z.array(Short).min(2).max(4),
  reveal: Line,
}).strict();
const WorkedBase = z.object({
  kind: z.literal('worked_problem'),
  title: Line,
  prompt: Line,
  u: z.number().finite(),
  v: z.number().finite(),
  t: z.number().positive().finite(),
  a: z.number().finite(),
  s: z.number().finite(),
  steps: z.array(z.object({
    text: Line,
    quantity: z.enum(['u', 'v', 't', 'a', 's']),
    value: z.number().finite(),
  }).strict()).min(2).max(6),
}).strict();

function checkLearnBlock(block: z.infer<typeof SliderBase> | z.infer<typeof MovingBase> | z.infer<typeof DragBase> | z.infer<typeof PredictBase> | z.infer<typeof WorkedBase>, ctx: z.RefinementCtx) {
  if (block.kind === 'slider_graph' && !close(block.a, (block.v - block.u) / block.t)) {
    ctx.addIssue({ code: 'custom', path: ['a'], message: 'a must equal (v - u) / t.' });
  }
  if (block.kind === 'moving_object' && !close(block.speed, block.distance / block.time)) {
    ctx.addIssue({ code: 'custom', path: ['speed'], message: 'speed must equal distance / time.' });
  }
  if (block.kind === 'drag_label') {
    const labels = new Set(block.labels.map((label) => label.id));
    const targets = new Set(block.targets.map((target) => target.id));
    if (labels.size !== block.labels.length || targets.size !== block.targets.length) {
      ctx.addIssue({ code: 'custom', message: 'Use distinct labels and targets.' });
    }
    if (block.pairs.length !== block.labels.length) ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'Pair every label.' });
    for (const pair of block.pairs) {
      if (!labels.has(pair.labelId) || !targets.has(pair.targetId)) {
        ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'Pairs must use these labels and targets.' });
      }
    }
  }
  if (block.kind === 'worked_problem') {
    const a = (block.v - block.u) / block.t;
    const s = block.u * block.t + 0.5 * a * block.t * block.t;
    if (!close(block.a, a)) ctx.addIssue({ code: 'custom', path: ['a'], message: 'a must equal (v - u) / t.' });
    if (!close(block.s, s)) ctx.addIssue({ code: 'custom', path: ['s'], message: 's must equal ut + ½at².' });
    const values = { u: block.u, v: block.v, t: block.t, a, s };
    block.steps.forEach((step, index) => {
      if (!close(step.value, values[step.quantity])) {
        ctx.addIssue({ code: 'custom', path: ['steps', index, 'value'], message: 'This step does not match the formula.' });
      }
    });
  }
}

export const SliderGraphBlockSchema = SliderBase.superRefine(checkLearnBlock);
export const MovingObjectBlockSchema = MovingBase.superRefine(checkLearnBlock);
export const DragLabelBlockSchema = DragBase.superRefine(checkLearnBlock);
export const PredictRevealBlockSchema = PredictBase;
export const WorkedProblemBlockSchema = WorkedBase.superRefine(checkLearnBlock);
export const LearnBlockSchema = z.discriminatedUnion('kind', [SliderBase, MovingBase, DragBase, PredictBase, WorkedBase]).superRefine(checkLearnBlock);
export type LearnBlock = z.infer<typeof LearnBlockSchema>;

export function parseLearnBlock(input: unknown) {
  return LearnBlockSchema.parse(input);
}

const Checkpoint = z.object({
  id: Id, prompt: Line, options: z.array(Short).min(2).max(6), answer: Short, explanation: Line,
}).strict().superRefine((item, ctx) => {
  if (!item.options.includes(item.answer) || new Set(item.options).size !== item.options.length) {
    ctx.addIssue({ code: 'custom', path: ['answer'], message: 'Use distinct options and an answer from those options.' });
  }
});

export const ConceptLessonSchema = z.object({
  bridge: z.object({ prereqTitle: Line, link: Line, repair: Line }).strict(),
  notes: z.object({ simple: NoteBody, standard: NoteBody, stretch: NoteBody }).strict(),
  steps: z.array(z.object({ body: NoteBody, checkpoint: Checkpoint }).strict()).min(1).max(4),
  worked: z.object({ prompt: Line, hinted: z.array(Line).min(1).max(4), unhinted: Line }).strict(),
  faded: z.object({ itemId: Id, prompt: Line, hint: Line, answers: z.array(Short).min(1).max(6) }).strict(),
  misconceptions: z.array(z.object({ slip: Line, fix: Line }).strict()).min(1).max(4),
  explainBack: z.object({
    itemId: Id, ownWords: Line, gap: Line, gapAnswers: z.array(Short).min(1).max(6),
  }).strict(),
  summary: z.object({ lines: z.array(Line).min(2).max(8), formulas: z.array(Line).min(1).max(5) }).strict(),
  flashcards: z.array(z.object({ id: Id, front: Line, back: Line }).strict()).min(2).max(12),
  blocks: z.array(LearnBlockSchema).min(1).max(4),
}).strict().superRefine((lesson, ctx) => {
  if (!/\p{Script=Devanagari}/u.test(lesson.notes.simple)) {
    ctx.addIssue({ code: 'custom', path: ['notes', 'simple'], message: 'The simple note includes Hindi terms.' });
  }
});
export type ConceptLesson = z.infer<typeof ConceptLessonSchema>;

const PublicDrag = z.object({
  kind: z.literal('drag_label'),
  title: Line,
  prompt: Line,
  labels: z.array(LabelBit).min(2).max(6),
  targets: z.array(LabelBit).min(2).max(6),
}).strict();
export const PublicBlockSchema = z.discriminatedUnion('kind', [
  SliderBase, MovingBase, PublicDrag, PredictBase, WorkedBase,
]);

export const PublicLessonSchema = z.object({
  conceptId: Id,
  title: Line,
  variant: NoteVariantSchema,
  note: NoteBody,
  bridge: z.object({
    prereqTitle: Line, link: Line, repair: Line.nullable(), minutes: z.literal(3).nullable(),
  }).strict(),
  steps: z.array(z.object({
    body: NoteBody,
    checkpoint: z.object({ id: Id, prompt: Line, options: z.array(Short).min(2).max(6) }).strict(),
  }).strict()).min(1).max(4),
  worked: z.object({ prompt: Line, hinted: z.array(Line).min(1).max(4), unhinted: Line }).strict(),
  faded: z.object({ prompt: Line, hint: Line }).strict(),
  misconceptions: z.array(z.object({ slip: Line, fix: Line }).strict()).min(1).max(4),
  explainBack: z.object({ ownWords: Line, gap: Line }).strict(),
  summary: z.object({ lines: z.array(Line).min(2).max(8), formulas: z.array(Line).min(1).max(5) }).strict(),
  flashcards: z.array(z.object({ id: Id, front: Line, back: Line }).strict()).min(2).max(12),
  blocks: z.array(PublicBlockSchema).min(1).max(4),
  revisionDays: z.tuple([z.literal(1), z.literal(3), z.literal(7)]),
}).strict();
export type PublicLesson = z.infer<typeof PublicLessonSchema>;

export const LessonViewSchema = z.discriminatedUnion('found', [
  z.object({ found: z.literal(false) }).strict(),
  PublicLessonSchema.extend({ found: z.literal(true) }).strict(),
]);
export type LessonView = z.infer<typeof LessonViewSchema>;

/** Client-generated per intentional attempt; a replay of the same request reuses it, a retry gets a new one. */
const AttemptId = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional();

export const SubmitCheckpointSchema = z.object({
  attemptId: AttemptId,
  itemId: Id, answer: Short, confidence: z.enum(['sure', 'unsure', 'guess']),
  timeMs: z.number().int().nonnegative().max(86_400_000).default(0),
}).strict();
export const CheckpointResultSchema = z.object({ correct: z.boolean(), explanation: Line }).strict();

export const SubmitFadedSchema = z.object({
  attemptId: AttemptId,
  answer: Short, hinted: z.boolean(), confidence: z.enum(['sure', 'unsure', 'guess']),
  timeMs: z.number().int().nonnegative().max(86_400_000).default(0),
}).strict();

export const SubmitExplainSchema = z.object({
  attemptId: AttemptId,
  ownWords: z.string().trim().min(8).max(500),
  gap: Short,
  confidence: z.enum(['sure', 'unsure', 'guess']),
  timeMs: z.number().int().nonnegative().max(86_400_000).default(0),
}).strict();
export const ExplainResultSchema = z.object({ correct: z.boolean(), explanation: Line, queued: z.literal(true) }).strict();

export const SubmitFlashcardSchema = z.object({
  attemptId: AttemptId,
  cardId: Id, rating: z.enum(['knew', 'almost', 'forgot']),
  timeMs: z.number().int().nonnegative().max(86_400_000).default(0),
}).strict();
export const FlashcardResultSchema = z.object({ queued: z.literal(true) }).strict();

export const SubmitLabelSchema = z.object({
  blockIndex: z.number().int().min(0).max(3),
  placements: z.array(z.object({ labelId: z.string().min(1).max(40), targetId: z.string().min(1).max(40) }).strict()).min(2).max(6),
}).strict();
export const LabelResultSchema = z.object({ correct: z.boolean(), explanation: Line }).strict();
export const RevisionQueuedSchema = z.object({ days: z.tuple([z.literal(1), z.literal(3), z.literal(7)]) }).strict();

export function toPublicLesson(lesson: ConceptLesson, input: {
  conceptId: string; title: string; variant: NoteVariant; weakPrereq: boolean;
}): PublicLesson {
  return PublicLessonSchema.parse({
    conceptId: input.conceptId,
    title: input.title,
    variant: input.variant,
    note: lesson.notes[input.variant],
    bridge: {
      prereqTitle: lesson.bridge.prereqTitle,
      link: lesson.bridge.link,
      repair: input.weakPrereq ? lesson.bridge.repair : null,
      minutes: input.weakPrereq ? 3 : null,
    },
    steps: lesson.steps.map((step) => ({
      body: step.body,
      checkpoint: { id: step.checkpoint.id, prompt: step.checkpoint.prompt, options: step.checkpoint.options },
    })),
    worked: lesson.worked,
    faded: { prompt: lesson.faded.prompt, hint: lesson.faded.hint },
    misconceptions: lesson.misconceptions,
    explainBack: { ownWords: lesson.explainBack.ownWords, gap: lesson.explainBack.gap },
    summary: lesson.summary,
    flashcards: lesson.flashcards,
    blocks: lesson.blocks.map((block) => block.kind === 'drag_label'
      ? { kind: block.kind, title: block.title, prompt: block.prompt, labels: block.labels, targets: block.targets }
      : block),
    revisionDays: [1, 3, 7],
  });
}
