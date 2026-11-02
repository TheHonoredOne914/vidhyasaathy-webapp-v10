import { randomUUID } from 'node:crypto';
import { LearningPlanSchema, type GameRegistryEntry, type LearningModule, type LearningPlan } from '@vidhyasaathy/contracts';
import type { JsonModel } from './proto-model.ts';

export type PlanEvidence = { states?: { conceptId: string; mastery: number; attempts: number }[]; diagnostic?: unknown; mistakes?: unknown[] };

export async function buildLearningPlan(modules: LearningModule[], games: GameRegistryEntry[], generate: JsonModel, evidence: PlanEvidence = {}, debug?: (message: string) => void): Promise<LearningPlan> {
  const first = modules[0];
  if (!first) throw new Error('A chapter module is required');
  const activities = games.filter((row) => row.available && row.chapterId === first.chapterId);
  const pending = [...new Set(modules.map((row) => row.conceptId))].filter((id) => !evidence.states?.some((row) => row.conceptId === id && row.attempts > 0 && row.mastery >= 0.7));
  pending.sort((a, b) => (evidence.states?.find((row) => row.conceptId === a)?.mastery ?? 0.5) - (evidence.states?.find((row) => row.conceptId === b)?.mastery ?? 0.5));
  const focus = pending.length ? pending : [first.conceptId];
  const steps: LearningPlan['steps'] = [];
  function add(type: LearningModule['type'], conceptId = focus[0]!, game = false) {
    const module = modules.find((row) => row.type === type && row.conceptId === conceptId) ?? modules.find((row) => row.type === type) ?? first!;
    const activity = game ? activities[0] : undefined;
    steps.push({ moduleId: module.id, ...(activity ? { activityId: activity.id, href: activity.route } : {}) });
  }
  add('explorer', focus[0], true);
  for (const id of focus.slice(0, pending.length ? 2 : 1)) {
    add('concept', id); add('guided_example', id); add('practice', id);
    if (evidence.states?.some((row) => row.conceptId === id && row.attempts > 0 && row.mastery < 0.4)) add('repair', id);
  }
  add('explorer', focus[0], true); add('revision');
  const fallback: LearningPlan = { id: randomUUID(), subjectId: first.subjectId, chapterId: first.chapterId,
    objectives: [...new Set(modules.filter((row) => focus.includes(row.conceptId)).map((row) => row.objective))],
    steps, currentStep: 0, status: 'fallback' };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await generate(`Build an NCERT chapter learning plan using ONLY the supplied module and activity IDs.
Use the supplied adaptive path: Explore, Learn, Try, Fix only when needed, Play, Master. Keep 8-12 steps, fewer for mastered chapters. Skip mastered ideas. Preserve game steps.
Return JSON {id,subjectId,chapterId,objectives:string[],steps:[{moduleId,activityId?}],currentStep:0,status:"active"}.
Do not generate questions or scores. This is planning, not a diagnostic. ${attempt ? 'The last response was invalid; return the exact JSON shape.' : ''}`,
      { subjectId: first.subjectId, chapterId: first.chapterId, modules, activities, evidence, suggestedSteps: steps });
      const plan = LearningPlanSchema.parse(raw);
      let repaired = false;
      plan.steps = plan.steps.slice(0, 12).map((step, index) => {
        const module = modules.find((row) => row.id === step.moduleId) ?? modules[index % modules.length]!;
        if (module.id !== step.moduleId) repaired = true;
        const activity = games.find((row) => row.id === step.activityId && row.available && row.chapterId === first.chapterId);
        if (step.activityId && !activity) repaired = true;
        return { moduleId: module.id, ...(activity ? { activityId: activity.id, href: activity.route } : {}) };
      });
      if (!plan.steps.some((step) => modules.find((row) => row.id === step.moduleId)?.type === 'concept')
        || !plan.steps.some((step) => modules.find((row) => row.id === step.moduleId)?.type === 'practice')) throw new Error('Missing teaching or practice');
      if (plan.steps.length < steps.length || (activities.length && !plan.steps.some((step) => step.activityId))
        || plan.steps.some((step) => !focus.includes(modules.find((row) => row.id === step.moduleId)!.conceptId))) throw new Error('Invalid adaptive path');
      return { ...plan, id: fallback.id, subjectId: first.subjectId, chapterId: first.chapterId, currentStep: 0, status: repaired ? 'fallback' : 'active' };
    } catch (error) { debug?.(error instanceof Error ? error.name : 'Invalid learning plan'); }
  }
  return fallback;
}
