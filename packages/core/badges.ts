import { ABSENCE_DAYS } from './streak.ts';

export const BADGE_IDS = ['fixed_it', 'comeback_king', 'dushman_slayer', 'boss_buster'] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export interface BadgeTrigger {
  id: string;
  kind: 'mastery' | 'recovery_completed' | 'dushman_retired';
  conceptId?: string | null;
  fromLevel?: number | null;
  toLevel?: number | null;
  absentDays?: number | null;
  absenceStartDay?: string | null;
}

export interface BadgeHistoryRow { badgeId: string; scopeKey: string }

export interface BadgeAward {
  badgeId: Exclude<BadgeId, 'boss_buster'>;
  scopeKey: string;
  triggerEventId: string;
}

/** Boss Buster stays in the catalog and is not awarded in this phase. */
export function evaluateBadges(event: BadgeTrigger, history: readonly BadgeHistoryRow[]): BadgeAward[] {
  const awards: BadgeAward[] = [];
  const propose = (badgeId: BadgeAward['badgeId'], scopeKey: string | null | undefined) => {
    if (!scopeKey) return;
    if (history.some((row) => row.badgeId === badgeId && row.scopeKey === scopeKey)) return;
    if (awards.some((row) => row.badgeId === badgeId && row.scopeKey === scopeKey)) return;
    awards.push({ badgeId, scopeKey, triggerEventId: event.id });
  };
  if (event.kind === 'mastery' && event.fromLevel === 1 && event.toLevel === 2) propose('fixed_it', event.conceptId);
  if (event.kind === 'recovery_completed' && (event.absentDays ?? 0) >= ABSENCE_DAYS) propose('comeback_king', event.absenceStartDay);
  if (event.kind === 'dushman_retired' && (event.toLevel ?? 0) >= 3) propose('dushman_slayer', event.conceptId);
  return awards;
}
