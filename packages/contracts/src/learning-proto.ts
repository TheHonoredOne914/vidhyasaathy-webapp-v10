import { z } from 'zod';

const Ref = z.string().min(1);
export const TeachingModeSchema = z.enum(['explain', 'teach_from_zero', 'simpler', 'differently', 'real_life_example', 'visual', 'hint', 'test_me', 'find_my_mistake', 'practise', 'revise', 'plan_my_learning']);
export type TeachingMode = z.infer<typeof TeachingModeSchema>;
export const LearningContextSchema = z.object({
  studentId: Ref, subjectId: Ref, chapterId: Ref, conceptId: Ref,
  sessionId: Ref, step: z.number().int().nonnegative(),
  recentAttempts: z.array(z.object({ questionId: Ref, answer: z.string(), correct: z.boolean().optional() })),
});
export type LearningContext = z.infer<typeof LearningContextSchema>;
export const ModuleRefSchema = z.object({ moduleId: Ref, activityId: Ref.optional(), href: Ref.optional() });
export type ModuleRef = z.infer<typeof ModuleRefSchema>;
export const LearningPlanSchema = z.object({
  id: Ref, subjectId: Ref, chapterId: Ref, objectives: z.array(z.string()),
  steps: z.array(ModuleRefSchema).min(1), currentStep: z.number().int().nonnegative(),
  status: z.enum(['active', 'completed', 'fallback']),
});
export type LearningPlan = z.infer<typeof LearningPlanSchema>;
// Public questions deliberately contain no answer keys.
export const LearningQuestionSchema = z.object({ id: Ref, prompt: z.string(), options: z.array(z.string()).optional() });
export const LearningSlideSchema = z.object({
  id: Ref, title: z.string(), kicker: z.string(), bullets: z.array(z.string()).min(1), note: z.string().optional(),
});
export type LearningSlide = z.infer<typeof LearningSlideSchema>;
export const LearningModuleSchema = z.object({
  id: Ref, subjectId: Ref, chapterId: Ref, conceptId: Ref,
  type: z.enum(['concept', 'guided_example', 'explorer', 'practice', 'repair', 'revision']),
  objective: z.string(), content: z.string(), questions: z.array(LearningQuestionSchema).optional(), activityId: Ref.optional(),
  slides: z.array(LearningSlideSchema).optional(),
});
export type LearningModule = z.infer<typeof LearningModuleSchema>;
export const LearningEventSchema = z.object({
  id: Ref, sessionId: Ref, type: Ref, conceptId: Ref, ts: z.string().datetime(),
  result: z.record(z.unknown()).optional(),
});
export type LearningEvent = z.infer<typeof LearningEventSchema>;
export const TutorResponseSchema = z.object({
  explanation: z.string().min(1), suggestedAction: z.string().min(1), conceptId: Ref,
  nextModuleId: Ref.optional(), practiceQuestion: LearningQuestionSchema.optional(),
});
export type TutorResponse = z.infer<typeof TutorResponseSchema>;
export const GameRegistryEntrySchema = z.object({
  id: Ref, title: Ref, subjectId: Ref, chapterId: Ref, conceptIds: z.array(Ref),
  route: Ref, description: z.string(), difficulty: z.enum(['introductory', 'developing', 'stretch']), available: z.boolean(),
});
export type GameRegistryEntry = z.infer<typeof GameRegistryEntrySchema>;
