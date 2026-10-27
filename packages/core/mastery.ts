export interface MasteryEvidence {
  clientEventId: string;
  correct: boolean;
  timestamp: number;
}

// Reversible defaults, not a claim of validated learning science.
export const MASTERY_HALF_LIFE_MS = 14 * 86400000;
export const LEITNER_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

export function calculateMastery(evidence: readonly MasteryEvidence[]) {
  const unique = new Map<string, MasteryEvidence>();
  for (const event of evidence) {
    if (!event.clientEventId || !Number.isSafeInteger(event.timestamp) || event.timestamp < 0) {
      throw new RangeError('Use an event ID and a nonnegative integer timestamp.');
    }
    const previous = unique.get(event.clientEventId);
    if (previous && (previous.correct !== event.correct || previous.timestamp !== event.timestamp)) {
      throw new RangeError('An event ID cannot identify different evidence.');
    }
    unique.set(event.clientEventId, event);
  }
  // Recompute in learning order, not receipt order, so late offline answers and regrades agree.
  const ordered = [...unique.values()].sort((a, b) => a.timestamp - b.timestamp
    || (a.clientEventId < b.clientEventId ? -1 : a.clientEventId > b.clientEventId ? 1 : 0));
  const latest = ordered.at(-1)?.timestamp ?? 0;
  let leitnerBox = 1;
  let correctWeight = 0;
  let totalWeight = 0;
  for (const event of ordered) {
    const weight = 2 ** (-(latest - event.timestamp) / MASTERY_HALF_LIFE_MS);
    totalWeight += weight;
    if (event.correct) correctWeight += weight;
    leitnerBox = event.correct ? Math.min(5, leitnerBox + 1) : 1;
  }
  return {
    mastery: totalWeight ? Math.min(1, Math.max(0, correctWeight / totalWeight)) : 0,
    leitnerBox,
    nextReview: Math.min(Number.MAX_SAFE_INTEGER, latest + (LEITNER_INTERVAL_DAYS[leitnerBox - 1] ?? 1) * 86400000),
    attempts: ordered.length,
  };
}
