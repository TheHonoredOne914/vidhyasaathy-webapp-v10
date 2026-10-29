export interface StudyPlanItem {
  id: string;
  chapterId: string;
  title: string;
  kind: 'assignment' | 'session' | 'remediation' | 'review' | 'game';
  required: boolean;
  dueAt: number | null;
  resumeAt: number;
}

export function buildStudyPlan<T extends StudyPlanItem>(input: readonly T[], now: number) {
  const endOfDay = (Math.floor(now / 86400000) + 1) * 86400000;
  // Unfinished work outranks a deadline, then revision, then anything new, then games.
  const priority = (item: T) => item.resumeAt > 0 ? 0
    : item.dueAt !== null && item.dueAt < endOfDay ? 1
    : item.kind === 'review' || item.kind === 'remediation' ? 2
    : item.kind === 'game' ? 4 : 3;
  // Copy before sorting; required work and teacher deadlines are never rewritten by recommendations.
  const items = [...input].sort((a, b) => priority(a) - priority(b)
    || (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER)
    || Number(b.resumeAt > 0) - Number(a.resumeAt > 0) || a.id.localeCompare(b.id));
  return { items, nextAction: items[0] ?? null,
    continue: items.find((item) => item.required && item.resumeAt > 0) ?? null };
}
