export interface StudyPlanItem {
  id: string;
  chapterId: string;
  title: string;
  kind: 'assignment' | 'session' | 'remediation' | 'review';
  required: boolean;
  dueAt: number | null;
  resumeAt: number;
}

export function buildStudyPlan<T extends StudyPlanItem>(input: readonly T[], now: number) {
  const endOfDay = (Math.floor(now / 86400000) + 1) * 86400000;
  const priority = (item: T) => item.required && item.dueAt !== null && item.dueAt < endOfDay ? 0
    : item.kind === 'remediation' ? 1 : item.required ? 2 : 3;
  // Copy before sorting; required work and teacher deadlines are never rewritten by recommendations.
  const items = [...input].sort((a, b) => priority(a) - priority(b)
    || (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER)
    || Number(b.resumeAt > 0) - Number(a.resumeAt > 0) || a.id.localeCompare(b.id));
  return { items, nextAction: items[0] ?? null,
    continue: items.find((item) => item.required && item.resumeAt > 0) ?? null };
}
