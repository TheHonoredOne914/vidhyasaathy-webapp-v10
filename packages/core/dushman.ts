import type { Band, Confidence, Level } from './learning.ts';

export const DUSHMAN_CAP = 3;
export const DUSHMAN_EVIDENCE_MIN = 3;

export interface DushmanState {
  conceptId: string;
  name: string;
  level: Level | null;
}

export interface DushmanEvidence {
  conceptId: string;
  correct: boolean;
  confidence: Confidence;
  notTaught: boolean;
  createdAt: number;
}

export interface DushmanPick {
  conceptId: string;
  name: string;
  level: Level;
  sureWrong: number;
  lastCorrectAt: number | null;
}

function counted(evidence: readonly DushmanEvidence[], conceptId: string) {
  return evidence.filter((row) => row.conceptId === conceptId && !row.notTaught)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** The weakest concepts that already have real evidence. Band 0-25 may start on the first evening. */
export function selectDushman(states: readonly DushmanState[], evidence: readonly DushmanEvidence[], band?: Band): DushmanPick[] {
  const minimum = band === '0-25' ? 1 : DUSHMAN_EVIDENCE_MIN;
  const ranked: DushmanPick[] = [];
  for (const state of states) {
    if (state.level == null || state.level >= 3) continue;
    const rows = counted(evidence, state.conceptId);
    if (rows.length < minimum) continue;
    const recent = rows.slice(-10);
    const correct = rows.filter((row) => row.correct);
    ranked.push({
      conceptId: state.conceptId,
      name: state.name,
      level: state.level,
      sureWrong: recent.filter((row) => !row.correct && row.confidence === 'sure').length,
      lastCorrectAt: correct.length ? correct[correct.length - 1]!.createdAt : null,
    });
  }
  return ranked.sort((a, b) => a.level - b.level || b.sureWrong - a.sureWrong
    || (a.lastCorrectAt ?? -1) - (b.lastCorrectAt ?? -1) || a.conceptId.localeCompare(b.conceptId)).slice(0, DUSHMAN_CAP);
}

export function dushmanRetirement(level: Level | null): { retire: boolean; badgeId: 'dushman_slayer' | null } {
  if (level !== null && level >= 3) return { retire: true, badgeId: 'dushman_slayer' };
  return { retire: false, badgeId: null };
}
