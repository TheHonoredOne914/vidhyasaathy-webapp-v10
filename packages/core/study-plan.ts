export interface StudyPlanItem {
  id: string;
  chapterId: string;
  title: string;
  kind: 'assignment' | 'session' | 'remediation' | 'review' | 'game';
  required: boolean;
  dueAt: number | null;
  resumeAt: number;
}

export function buildStudyPlan<T extends StudyPlanItem>(input: readonly T[], now: number, dueBefore?: number) {
  const endOfDay = dueBefore ?? (Math.floor(now / 86400000) + 1) * 86400000;
  // Unfinished work outranks a deadline, then revision, then anything new, then games.
  const priority = (item: T) => item.resumeAt > 0 ? 0
    : item.dueAt !== null && item.dueAt < endOfDay ? 1
    : item.kind === 'review' || item.kind === 'remediation' ? 2
    : item.kind === 'game' ? 4 : 3;
  // Copy before sorting; required work and teacher deadlines are never rewritten by recommendations.
  const items = [...input].sort((a, b) => priority(a) - priority(b)
    || (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER)
    || b.resumeAt - a.resumeAt || a.id.localeCompare(b.id));
  return { items, nextAction: items[0] ?? null,
    continue: items.find((item) => item.required && item.resumeAt > 0) ?? null };
}

export const PLAN_MINUTES = { repair: 10, learn: 15, revise: 5, practice: 8, warmup: 2 } as const;
export type PlanKind = keyof typeof PLAN_MINUTES;
const PIPELINE: readonly PlanKind[] = ['repair', 'learn', 'revise', 'practice'];
const DROPPABLE: ReadonlySet<PlanKind> = new Set(['practice', 'revise', 'warmup']);

export interface PlanConcept { id: string; shaky: boolean }
export interface PlanLevel { conceptId: string; level: number | null }
export interface NightItem {
  conceptId: string;
  kind: PlanKind;
  estMinutes: number;
  night: string;
  orderIdx: number;
  status: 'planned' | 'done' | 'folded' | 'dropped';
  reason: string | null;
}
export interface PlanEvent { key: string; kind: 'missed' | 'folded' }

function nextDay(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1) + 86400000).toISOString().slice(0, 10);
}

function prereqOrder(concepts: readonly PlanConcept[], graph: readonly { conceptId: string; prereqId: string }[], levels: readonly PlanLevel[]) {
  const weak = new Set(concepts.filter((concept) => concept.shaky).map((concept) => concept.id));
  for (const level of levels) if (level.level === 1) weak.add(level.conceptId);
  const ids = concepts.map((concept) => concept.id).filter((id) => weak.has(id));
  const needs = new Map(ids.map((id) => [id, [] as string[]]));
  for (const edge of graph) {
    if (needs.has(edge.conceptId) && needs.has(edge.prereqId)) needs.get(edge.conceptId)?.push(edge.prereqId);
  }
  const ordered: string[] = [];
  const pending = [...ids];
  while (pending.length) {
    const index = pending.findIndex((id) => (needs.get(id) ?? []).every((prereq) => ordered.includes(prereq)));
    if (index < 0) { ordered.push(...pending); break; }
    const [id] = pending.splice(index, 1);
    if (id) ordered.push(id);
  }
  return ordered;
}

export function buildNightlyPlan(input: {
  examDate: string;
  minutesPerNight?: number;
  concepts: readonly PlanConcept[];
  prereqGraph: readonly { conceptId: string; prereqId: string }[];
  levels: readonly PlanLevel[];
}, today: string) {
  const cap = input.minutesPerNight ?? 25;
  const tasks = prereqOrder(input.concepts, input.prereqGraph, input.levels)
    .flatMap((conceptId) => PIPELINE.map((kind) => ({ conceptId, kind, estMinutes: PLAN_MINUTES[kind] })));
  const items: NightItem[] = [];
  let night = today;
  let used = 0;
  for (const task of tasks) {
    if (task.estMinutes > cap) {
      items.push({ ...task, night, orderIdx: items.length, status: 'dropped', reason: 'longer than the night' });
      continue;
    }
    if (used > 0 && used + task.estMinutes > cap) {
      night = nextDay(night);
      used = 0;
    }
    if (night >= input.examDate && DROPPABLE.has(task.kind)) {
      items.push({ ...task, night, orderIdx: items.length, status: 'dropped', reason: 'does not fit before the exam' });
      continue;
    }
    items.push({ ...task, night, orderIdx: items.length, status: 'planned', reason: null });
    used += task.estMinutes;
  }
  return { minutesPerNight: cap, items, nights: groupNights(items) };
}

function openItem(item: NightItem) {
  return item.status === 'planned' || item.status === 'folded';
}

function groupNights(items: readonly NightItem[]) {
  const nights: { night: string; minutes: number; items: NightItem[] }[] = [];
  for (const item of items) {
    if (!openItem(item)) continue;
    let bucket = nights.find((night) => night.night === item.night);
    if (!bucket) {
      bucket = { night: item.night, minutes: 0, items: [] };
      nights.push(bucket);
    }
    bucket.items.push(item);
    bucket.minutes += item.estMinutes;
  }
  return nights;
}

/** Move a missed night forward by one day. Later nights move with it, so two nights never share a row. */
export function replanAfterMiss(items: readonly NightItem[], missedNight: string, examDate: string) {
  const events: PlanEvent[] = [];
  const next = items.map((item) => ({ ...item }));
  for (const item of next) {
    if (!openItem(item) || item.night < missedNight) continue;
    if (item.night === missedNight) {
      const key = `${item.conceptId}:${item.kind}`;
      events.push({ key, kind: 'missed' }, { key, kind: 'folded' });
      item.status = 'folded';
    }
    item.night = nextDay(item.night);
  }
  const droppable = next.filter((item) => openItem(item) && item.night >= examDate && DROPPABLE.has(item.kind))
    .sort((a, b) => Number(a.kind === 'revise') - Number(b.kind === 'revise') || b.night.localeCompare(a.night) || b.orderIdx - a.orderIdx);
  for (const item of droppable) {
    if (item.night < examDate) continue;
    item.status = 'dropped';
    item.reason = 'does not fit before the exam';
  }
  return { items: next, events, nights: groupNights(next) };
}
