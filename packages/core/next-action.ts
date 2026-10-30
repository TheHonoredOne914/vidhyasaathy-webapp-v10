import { CATCHUP_COPY } from './catchup.ts';
import { buildStudyPlan, type StudyPlanItem } from './study-plan.ts';
import { ABSENCE_DAYS, endOfTomorrowIst } from './streak.ts';

export { ABSENCE_DAYS };

export interface NextAction {
  kind: 'catchup' | 'unfinished' | 'due' | 'revision' | 'new' | 'game';
  title: string;
  conceptId: string | null;
  conceptName: string | null;
  estMinutes: number;
  href: string;
  resumeState: string | null;
}

export interface NextActionCandidate {
  id: string;
  kind: 'unfinished' | 'due' | 'revision' | 'new' | 'game';
  title: string;
  conceptId: string | null;
  conceptName: string | null;
  estMinutes: number;
  href: string;
  resumeState: string | null;
  dueAt: number | null;
  resumeAt: number;
  lateUntil: number | null;
  windowOpen: boolean;
}

export interface NextActionContext {
  absentDays: number;
  candidates: readonly NextActionCandidate[];
  catchUp: Omit<NextAction, 'kind'> | null;
}

function dueInWindow(item: NextActionCandidate, now: number, horizon: number) {
  if (!item.windowOpen || item.dueAt == null || item.dueAt >= horizon) return false;
  if (item.dueAt < now) return item.lateUntil != null && item.lateUntil >= now;
  return true;
}

function toStudy(item: NextActionCandidate): StudyPlanItem {
  return {
    id: item.id,
    chapterId: item.conceptId ?? 'chapter',
    title: item.title,
    kind: item.kind === 'due' ? 'assignment' : item.kind === 'revision' ? 'review' : item.kind === 'game' ? 'game' : 'session',
    required: item.kind === 'unfinished' || item.kind === 'due' || item.kind === 'new',
    dueAt: item.kind === 'due' ? item.dueAt : null,
    resumeAt: item.kind === 'unfinished' ? Math.max(item.resumeAt, 1) : 0,
  };
}

function fromCandidate(item: NextActionCandidate): NextAction {
  return {
    kind: item.kind, title: item.title, conceptId: item.conceptId, conceptName: item.conceptName,
    estMinutes: item.estMinutes, href: item.href, resumeState: item.resumeState,
  };
}

/**
 * One next thing. Catch-up outranks an open resume, then due work, revision, the path, and a game.
 * Ordering goes through buildStudyPlan so the older plan and this card stay one ranker.
 */
export function pickNextAction(ctx: NextActionContext, now: number): NextAction | null {
  if (ctx.absentDays >= ABSENCE_DAYS) {
    const card = ctx.catchUp;
    return {
      kind: 'catchup',
      title: card?.title ?? CATCHUP_COPY,
      conceptId: card?.conceptId ?? null,
      conceptName: card?.conceptName ?? null,
      estMinutes: card?.estMinutes ?? 20,
      href: card?.href ?? '/student/catchup',
      resumeState: card?.resumeState ?? null,
    };
  }
  const horizon = endOfTomorrowIst(now);
  const open = ctx.candidates.filter((item) => item.kind !== 'due' || dueInWindow(item, now, horizon));
  const plan = buildStudyPlan(open.map(toStudy), now, horizon);
  const top = plan.nextAction;
  if (!top) return null;
  const source = open.find((item) => item.id === top.id);
  return source ? fromCandidate(source) : null;
}
