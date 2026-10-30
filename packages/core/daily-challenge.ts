import type { Band, Level } from './learning.ts';

export const DAILY_CHALLENGE_CAP = 5;
export const DAILY_CHALLENGE_MINUTES = 5;

export interface ChallengeItem {
  id: string;
  conceptId: string;
  level: Level;
  seeded: boolean;
  board?: boolean;
}

export interface DailyChallenge {
  itemIds: string[];
  hindiTerms: boolean;
  timerVisible: boolean;
  showConfidence: true;
  maxQuestions: number;
  maxMinutes: number;
}

const BAND_RULE: Record<Band, { min: Level; max: Level; hindiTerms: boolean; timerVisible: boolean }> = {
  '0-25': { min: 1, max: 1, hindiTerms: true, timerVisible: false },
  '25-50': { min: 1, max: 2, hindiTerms: false, timerVisible: false },
  '50-75': { min: 2, max: 3, hindiTerms: false, timerVisible: false },
  '75-100': { min: 3, max: 4, hindiTerms: false, timerVisible: true },
};

function inBand(level: Level, rule: { min: Level; max: Level }) {
  return level >= rule.min && level <= rule.max;
}

function clampLevel(level: Level, rule: { min: Level; max: Level }): Level {
  if (level < rule.min) return rule.min;
  if (level > rule.max) return rule.max;
  return level;
}

function take(pool: readonly ChallengeItem[], picked: ChallengeItem[], concepts: readonly string[], limit: number, level?: Level) {
  const wanted = new Set(concepts);
  const ranked = pool.filter((item) => wanted.has(item.conceptId) && (level === undefined || item.level === level))
    .sort((a, b) => concepts.indexOf(a.conceptId) - concepts.indexOf(b.conceptId) || Number(b.board === true) - Number(a.board === true) || a.id.localeCompare(b.id));
  let count = 0;
  for (const item of ranked) {
    if (count >= limit || picked.length >= DAILY_CHALLENGE_CAP) return;
    if (picked.some((row) => row.id === item.id)) continue;
    picked.push(item);
    count += 1;
  }
}

/** Five seeded questions or five minutes. Fading and Dushman fill first; the band only chooses level. */
export function buildDailyChallenge(ctx: {
  fadingConceptIds: readonly string[];
  dushmanConceptIds: readonly string[];
  tonightConceptId: string;
  ladderLevel: Level;
  items: readonly ChallengeItem[];
}, band: Band): DailyChallenge {
  const rule = BAND_RULE[band];
  const pool = ctx.items.filter((item) => item.seeded && inBand(item.level, rule));
  const picked: ChallengeItem[] = [];
  take(pool, picked, ctx.fadingConceptIds, 2);
  take(pool, picked, ctx.dushmanConceptIds, 2);
  take(pool, picked, [ctx.tonightConceptId], DAILY_CHALLENGE_CAP, clampLevel(ctx.ladderLevel, rule));
  if (picked.length < DAILY_CHALLENGE_CAP) take(pool, picked, [ctx.tonightConceptId], DAILY_CHALLENGE_CAP);
  return {
    itemIds: picked.slice(0, DAILY_CHALLENGE_CAP).map((item) => item.id),
    hindiTerms: rule.hindiTerms,
    timerVisible: rule.timerVisible,
    showConfidence: true,
    maxQuestions: DAILY_CHALLENGE_CAP,
    maxMinutes: DAILY_CHALLENGE_MINUTES,
  };
}
