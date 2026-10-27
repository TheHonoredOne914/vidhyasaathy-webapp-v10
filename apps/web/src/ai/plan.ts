import type { Concept, PlanItem } from '@vidhyasaathy/contracts';

export function planHref(item: PlanItem): string {
  if (item.kind === 'assignment') return `/student/assignments/${item.id}`;
  if (item.kind === 'session') return `/student/sessions/${item.id}`;
  if (item.kind === 'remediation') return `/student/concepts/${item.id}/remediation`;
  return `/student/chapters/${item.chapterId}/concepts/${item.id}`;
}

export function planKind(item: PlanItem): string {
  if (item.kind === 'assignment') return 'Homework';
  if (item.kind === 'session') return 'Session';
  if (item.kind === 'remediation') return 'Short lesson';
  return 'Review';
}

export function resumeLabel(item: PlanItem): string {
  if (item.kind === 'session') return `Resume at slide ${item.resumeAt + 1}.`;
  if (item.kind === 'assignment') return `Resume at question ${item.resumeAt + 1}.`;
  return 'Start here.';
}

export function dueToday(item: PlanItem, now = Date.now()): boolean {
  if (item.dueAt === null) return false;
  if (item.dueAt <= now) return true;
  const due = new Date(item.dueAt);
  const today = new Date(now);
  return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth() && due.getDate() === today.getDate();
}

export function conceptDepth(concepts: Pick<Concept, 'id' | 'prerequisiteIds'>[]): Map<string, number> {
  const known = new Set(concepts.map((concept) => concept.id));
  const prerequisites = new Map(concepts.map((concept) => [concept.id, concept.prerequisiteIds.filter((id) => known.has(id))]));
  const depth = new Map<string, number>();
  function walk(id: string, seen: Set<string>): number {
    const saved = depth.get(id);
    if (saved !== undefined) return saved;
    if (seen.has(id)) return 0;
    seen.add(id);
    const next = (prerequisites.get(id) ?? []).reduce((max, prerequisite) => Math.max(max, walk(prerequisite, seen) + 1), 0);
    depth.set(id, next);
    return next;
  }
  for (const concept of concepts) walk(concept.id, new Set());
  return depth;
}
