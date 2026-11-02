import { randomUUID } from 'node:crypto';
import { LearningPlanSchema, type GameRegistryEntry, type LearningModule, type LearningPlan } from '@vidhyasaathy/contracts';
import type { JsonModel } from './proto-model.ts';

export async function buildLearningPlan(modules: LearningModule[], games: GameRegistryEntry[], generate: JsonModel): Promise<LearningPlan> {
  const first = modules[0];
  if (!first) throw new Error('A chapter module is required');
  const fallback: LearningPlan = { id: randomUUID(), subjectId: first.subjectId, chapterId: first.chapterId,
    objectives: [...new Set(modules.map((row) => row.objective))],
    steps: modules.map((row) => ({ moduleId: row.id })), currentStep: 0, status: 'fallback' };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await generate(`Build an NCERT chapter learning plan using ONLY the supplied module and activity IDs.
Sequence concept, guided example, explorer, practice, repair when needed, revision. Include a concept and practice step.
Return JSON {id,subjectId,chapterId,objectives:string[],steps:[{moduleId,activityId?}],currentStep:0,status:"active"}.
Do not generate questions or scores. This is planning, not a diagnostic. ${attempt ? 'The last response was invalid; return the exact JSON shape.' : ''}`,
      { subjectId: first.subjectId, chapterId: first.chapterId, modules, activities: games.filter((row) => row.available) });
      const plan = LearningPlanSchema.parse(raw);
      let repaired = false;
      plan.steps = plan.steps.slice(0, modules.length * 2).map((step, index) => {
        const module = modules.find((row) => row.id === step.moduleId) ?? modules[index % modules.length]!;
        if (module.id !== step.moduleId) repaired = true;
        const activity = games.find((row) => row.id === step.activityId && row.available && row.chapterId === first.chapterId);
        if (step.activityId && !activity) repaired = true;
        return { moduleId: module.id, ...(activity ? { activityId: activity.id } : {}) };
      });
      if (!plan.steps.some((step) => modules.find((row) => row.id === step.moduleId)?.type === 'concept')
        || !plan.steps.some((step) => modules.find((row) => row.id === step.moduleId)?.type === 'practice')) throw new Error('Missing teaching or practice');
      return { ...plan, id: fallback.id, subjectId: first.subjectId, chapterId: first.chapterId, currentStep: 0, status: repaired ? 'fallback' : 'active' };
    } catch { /* One retry, then the complete deterministic chapter path. */ }
  }
  return fallback;
}
