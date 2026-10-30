import type { Level } from './learning.ts';

export interface WarmupCard { front: string; back: string }
export interface WarmupCheck { id: string; level: Level }
export interface WarmupPrereq {
  conceptId: string;
  name: string;
  flashcards: readonly WarmupCard[];
  checks: readonly WarmupCheck[];
}

export interface WarmupOffer {
  tonightConceptId: string;
  estMinutes: 2;
  concepts: { conceptId: string; name: string; cards: WarmupCard[]; checkId: string }[];
}

/** Up to two fading prerequisites, 2–4 cards and one L1 check each. A skip hides it for that IST day. */
export function buildWarmup(
  tonightConceptId: string,
  prereqs: readonly WarmupPrereq[],
  radar: readonly { conceptId: string }[],
  options: { skippedDay?: string | null; today?: string | null } = {},
): WarmupOffer | null {
  if (options.skippedDay && options.today && options.skippedDay === options.today) return null;
  const fading = new Set(radar.map((row) => row.conceptId));
  const concepts = [];
  for (const prereq of prereqs) {
    if (concepts.length >= 2) break;
    if (prereq.conceptId === tonightConceptId || !fading.has(prereq.conceptId)) continue;
    const cards = prereq.flashcards.slice(0, 4);
    const check = prereq.checks.find((item) => item.level === 1);
    if (cards.length < 2 || !check) continue;
    concepts.push({ conceptId: prereq.conceptId, name: prereq.name, cards: [...cards], checkId: check.id });
  }
  if (!concepts.length) return null;
  return { tonightConceptId, estMinutes: 2, concepts };
}
