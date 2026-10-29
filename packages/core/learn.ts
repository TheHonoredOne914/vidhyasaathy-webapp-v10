import type { NoteVariant } from '@vidhyasaathy/contracts';
import type { Level } from './learning.ts';

export const REVISION_DAYS = [1, 3, 7] as const;
export type RevisionDay = (typeof REVISION_DAYS)[number];

/** Simple notes for a fragile or "explain simpler" request. New and steady stay on the standard note. Stretch is for strong work. */
export function pickNoteVariant(level: Level | null, simpler = false): NoteVariant {
  if (simpler || level === 1) return 'simple';
  if (level === 3 || level === 4) return 'stretch';
  return 'standard';
}

export function revisionDueAt(now: number) {
  return REVISION_DAYS.map((days) => ({ days, dueAt: now + days * 86_400_000 }));
}

export function prereqIsWeak(state: { masteryLevel: number | null; misconception: boolean } | null) {
  if (!state) return false;
  return state.misconception || state.masteryLevel === 1;
}
