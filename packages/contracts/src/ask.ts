import { z } from 'zod';

export const AskStreamSchema = z.object({
  clientEventId: z.string().trim().min(1).max(100), threadId: z.string().max(100).optional(),
  text: z.string().trim().min(1).max(800), style: z.enum(['hints', 'explain']).default('hints'),
  mode: z.enum(['learn', 'homework']).default('learn'), conceptId: z.string().max(100).optional(),
  chapterId: z.string().max(100).optional(), assignmentItemId: z.string().max(100).optional(),
  from: z.object({ kind: z.enum(['practice', 'lesson', 'homework', 'session', 'home']), ref: z.string().max(100).optional(), label: z.string().max(60).optional() }).optional(),
  followupKind: z.enum(['another', 'why', 'reverse', 'example', 'simpler', 'quiz']).optional(), snapId: z.string().max(100).optional(),
}).strict();
export type AskStreamInput = z.infer<typeof AskStreamSchema>;
export const AskQuickAnswerSchema = z.object({
  clientEventId: z.string().min(1).max(100), threadId: z.string().min(1).max(100),
  optionId: z.string().min(1).max(100), confidence: z.enum(['sure', 'unsure', 'guess']).optional(),
}).strict();

// A bounded, text-only contract: never execute provider HTML, SVG or scripts.
const CardText = z.string().trim().min(1).max(2000);
const ChartNumber = z.number().finite().min(-1_000_000).max(1_000_000);
export const SaathyChartSchema = z.object({
  kind: z.enum(['line', 'bar']), xLabel: CardText, yLabel: CardText,
  series: z.array(z.object({ name: CardText, points: z.array(z.object({ x: ChartNumber, y: ChartNumber, label: CardText.optional() })).min(1).max(50) })).min(1).max(3),
  categories: z.array(CardText).max(50).optional(), xMin: ChartNumber.optional(), xMax: ChartNumber.optional(), yMin: ChartNumber.optional(), yMax: ChartNumber.optional(),
});
export const SaathyDemoSchema = z.object({
  widget: z.enum(['numberline', 'parabola', 'apline', 'dice', 'pythag', 'linegraph', 'timeline', 'motion', 'wave', 'atom', 'angles', 'fraction', 'market', 'pyramid']),
  params: z.record(z.union([z.number().finite().min(-1000).max(1000), z.string().max(60)])).refine((value) => Object.keys(value).length <= 12).optional(),
  events: z.array(z.object({ when: CardText, what: CardText })).min(1).max(20).optional(), prompt: CardText.optional(),
});
export const SaathyArtifactSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('explanation'), title: CardText, body: CardText }),
  z.object({ type: z.literal('worked-example'), title: CardText, steps: z.array(CardText).min(1).max(8) }),
  z.object({ type: z.literal('notes'), title: CardText, points: z.array(CardText).min(1).max(8) }),
  z.object({ type: z.literal('diagram'), title: CardText, nodes: z.array(CardText).min(2).max(8) }),
  z.object({ type: z.literal('chart'), title: CardText, chart: SaathyChartSchema }),
  z.object({ type: z.literal('demo'), title: CardText, demo: SaathyDemoSchema }),
]);
export type SaathyArtifact = z.infer<typeof SaathyArtifactSchema>;

export const AskHintSchema = z.object({
  threadId: z.string().min(1).max(100), stage: z.enum(['nudge', 'hint', 'worked-step']),
}).strict();
