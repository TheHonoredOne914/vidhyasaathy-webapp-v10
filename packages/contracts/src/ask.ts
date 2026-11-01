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
export const SaathyArtifactSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('explanation'), title: CardText, body: CardText }),
  z.object({ type: z.literal('worked-example'), title: CardText, steps: z.array(CardText).min(1).max(8) }),
  z.object({ type: z.literal('notes'), title: CardText, points: z.array(CardText).min(1).max(8) }),
  z.object({ type: z.literal('diagram'), title: CardText, nodes: z.array(CardText).min(2).max(8) }),
]);
export type SaathyArtifact = z.infer<typeof SaathyArtifactSchema>;

export const AskHintSchema = z.object({
  threadId: z.string().min(1).max(100), stage: z.enum(['nudge', 'hint', 'worked-step']),
}).strict();
