import type { Level } from './learning.ts';
import { SESSION_PASS_RATIO } from './learning.ts';
import { MASTERY_HALF_LIFE_MS } from './mastery.ts';

export const LEVEL_FLOOR: Record<Level, number> = { 1: 0.25, 2: SESSION_PASS_RATIO, 3: 0.75, 4: 0.75 };
export const CONSECUTIVE_FAST_WRONG = 3;
export const FAST_WRONG_MS = 8_000;
export const RESUBMIT_COUNT = 2;
export const RESUBMIT_WINDOW_MS = 5_000;
export const ABANDON_COUNT = 2;
export const ABANDON_WINDOW_MS = 10 * 60_000;
export const FRUSTRATION_TONE = "Let's slow down. A smaller step will do.";
export const FRUSTRATION_BRIDGE = "Let's try a smaller step first.";
export const FRUSTRATION_BREAK = 'Take a 2-minute break?';

export interface RadarState {
  conceptId: string;
  name: string;
  level: Level | null;
  mastery: number;
  updatedAt: number;
  nextReview: number | null;
}

export function decayedMastery(mastery: number, updatedAt: number, now: number) {
  if (now <= updatedAt) return mastery;
  return mastery * 2 ** (-(now - updatedAt) / MASTERY_HALF_LIFE_MS);
}

/** Fading concepts, most decayed first. New concepts are not fading. */
export function revisionRadar(states: readonly RadarState[], now: number) {
  const fading = states.filter((state) => {
    if (state.level == null) return false;
    const decayed = decayedMastery(state.mastery, state.updatedAt, now);
    const reviewDue = state.nextReview != null && state.nextReview <= now;
    return reviewDue || decayed < LEVEL_FLOOR[state.level];
  });
  return fading.sort((a, b) => decayedMastery(a.mastery, a.updatedAt, now) - decayedMastery(b.mastery, b.updatedAt, now)
    || (a.nextReview ?? 0) - (b.nextReview ?? 0)
    || a.conceptId.localeCompare(b.conceptId));
}

export interface FrustrationEvidence {
  correct: boolean;
  timeMs: number;
  at: number;
}

export interface SessionSignal {
  kind: 'resubmit' | 'abandon';
  stepId: string;
  at: number;
}

export interface FrustrationFlag {
  tone: string;
  nextSetSize: 3;
  ladderDelta: -1;
  bridge: string;
  breakCard: string;
  learningEvent: { kind: 'frustration_flagged' };
}

function consecutiveFastWrong(evidence: readonly FrustrationEvidence[]) {
  const ordered = [...evidence].sort((a, b) => a.at - b.at);
  let run = 0;
  for (const event of ordered) {
    run = !event.correct && event.timeMs < FAST_WRONG_MS ? run + 1 : 0;
    if (run >= CONSECUTIVE_FAST_WRONG) return true;
  }
  return false;
}

function clustered(events: readonly SessionSignal[], kind: SessionSignal['kind'], count: number, windowMs: number, sameStep: boolean) {
  const rows = events.filter((event) => event.kind === kind).sort((a, b) => a.at - b.at);
  for (let i = 0; i < rows.length; i += 1) {
    let hits = 1;
    for (let j = i + 1; j < rows.length; j += 1) {
      const later = rows[j];
      const earlier = rows[i];
      if (!later || !earlier || later.at - earlier.at > windowMs) break;
      if (sameStep && later.stepId !== earlier.stepId) continue;
      hits += 1;
      if (hits >= count) return true;
    }
  }
  return false;
}

/** Softens the next set. Never an alarm colour. Teachers only see the event count. */
export function frustrationRadar(recentEvidence: readonly FrustrationEvidence[], sessionEvents: readonly SessionSignal[]): FrustrationFlag | null {
  const flagged = consecutiveFastWrong(recentEvidence)
    || clustered(sessionEvents, 'resubmit', RESUBMIT_COUNT, RESUBMIT_WINDOW_MS, false)
    || clustered(sessionEvents, 'abandon', ABANDON_COUNT, ABANDON_WINDOW_MS, true);
  if (!flagged) return null;
  return {
    tone: FRUSTRATION_TONE,
    nextSetSize: 3,
    ladderDelta: -1,
    bridge: FRUSTRATION_BRIDGE,
    breakCard: FRUSTRATION_BREAK,
    learningEvent: { kind: 'frustration_flagged' },
  };
}
