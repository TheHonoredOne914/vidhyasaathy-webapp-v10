import { ABSENCE_DAYS } from './streak.ts';

export const CATCHUP_COPY = "Good to see you. Let's take this in small steps.";

export interface CatchupConcept { conceptId: string; name: string; decayed: number }
export interface CatchupStep {
  conceptId: string;
  name: string;
  kind: 'recap' | 'session';
  note: 'simple' | 'standard';
  questions: number;
  level: 1 | null;
  estMinutes: number;
}

export interface CatchupPlan {
  copy: string;
  estMinutes: number;
  steps: CatchupStep[];
  events: { offered: 'recovery_offered'; completed: 'recovery_completed' };
}

export function buildCatchup(ctx: {
  absentDays: number;
  decayed: readonly CatchupConcept[];
  tonight: { conceptId: string; name: string };
}): CatchupPlan | null {
  if (ctx.absentDays < ABSENCE_DAYS) return null;
  const weakest = [...ctx.decayed].sort((a, b) => a.decayed - b.decayed || a.conceptId.localeCompare(b.conceptId)).slice(0, 2);
  const steps: CatchupStep[] = [
    ...weakest.map((concept) => ({
      conceptId: concept.conceptId, name: concept.name, kind: 'recap' as const, note: 'simple' as const,
      questions: 2, level: 1 as const, estMinutes: 5,
    })),
    {
      conceptId: ctx.tonight.conceptId, name: ctx.tonight.name, kind: 'session' as const, note: 'standard' as const,
      questions: 3, level: null, estMinutes: 10,
    },
  ];
  return {
    copy: CATCHUP_COPY,
    estMinutes: steps.reduce((sum, step) => sum + step.estMinutes, 0),
    steps,
    events: { offered: 'recovery_offered', completed: 'recovery_completed' },
  };
}
