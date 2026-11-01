export const LEVEL_WORDS = {
  1: "Let's fix this",
  2: 'Almost there',
  3: 'Mastered',
  4: 'Top form',
} as const;

export const NEW_WORD = 'New';
export const NOT_TAUGHT = "Haven't learned this yet";
export const BRIDGE_ON_DROP = "Let's warm up with a simpler one";
export const SESSION_BRIDGE = "Let's repair the ideas that slipped, then try the check again.";
export const SESSION_PASS_RATIO = 0.6;

export type Confidence = 'sure' | 'unsure' | 'guess';
export type ErrorFamily = 'concept_gap' | 'careless' | 'method' | 'guess';
export type Level = 1 | 2 | 3 | 4;
export type Band = '0-25' | '25-50' | '50-75' | '75-100';
export type LevelWord = (typeof LEVEL_WORDS)[Level] | typeof NEW_WORD;
export type DiagnosticRoute = 'challenge' | 'steady' | 'repair';

export interface LearningEvent {
  weight?: number;
  correct: boolean;
  confidence: Confidence;
  level: Level;
  timeMs: number;
  markedFamily?: ErrorFamily | null;
  notTaught?: boolean;
}

export interface LadderState {
  level: Level;
  streakCorrect: number;
  streakWrong: number;
}

const FAST_MS = 8_000;

export function levelWord(level: Level | null): LevelWord {
  return level === null ? NEW_WORD : LEVEL_WORDS[level];
}

export function isNotTaughtAnswer(answer: unknown): boolean {
  return answer === NOT_TAUGHT || (Array.isArray(answer) && answer.includes(NOT_TAUGHT));
}

/** A correct guess is not evidence of mastery. */
export function countsAsMastery(event: Pick<LearningEvent, 'correct' | 'confidence' | 'notTaught'>): boolean {
  return event.correct && event.confidence !== 'guess' && !event.notTaught;
}

/** Sure and wrong is a misconception, the strongest diagnostic signal. */
export function isMisconception(event: Pick<LearningEvent, 'correct' | 'confidence' | 'notTaught'>): boolean {
  return !event.correct && event.confidence === 'sure' && !event.notTaught;
}

export function masteryFromEvents(events: readonly LearningEvent[]): { score: number; level: Level | null; misconception: boolean } {
  const counted = events.filter((event) => !event.notTaught);
  if (!counted.length) return { score: 0, level: null as Level | null, misconception: false };
  const recent = counted.slice(-10);
  let credit = 0;
  let weight = 0;
  for (const event of recent) {
    const itemWeight = event.level * (event.weight ?? 1);
    weight += itemWeight;
    if (event.correct && event.confidence === 'sure') credit += itemWeight;
    else if (event.correct && event.confidence === 'unsure') credit += itemWeight * 0.5;
  }
  const score = weight ? credit / weight : 0;
  const sureAt = (minimum: Level) => recent.filter((event) => event.correct && event.confidence === 'sure' && event.level >= minimum).length;
  let level: Level = 1;
  if (score >= 0.75 && sureAt(4) >= 2) level = 4;
  else if (score >= 0.6 && sureAt(3) >= 2) level = 3;
  else if (score >= SESSION_PASS_RATIO) level = 2;
  const fullWeight = counted.filter((event) => (event.weight ?? 1) >= 1);
  // Games support learning, but cannot establish or promote mastery alone.
  const ceiling = fullWeight.length === counted.length ? level : masteryFromEvents(fullWeight).level;
  return { score, level: ceiling === null ? null : Math.min(level, ceiling) as Level, misconception: recent.some((event) => isMisconception(event)) };
}

export function stepLadder(state: LadderState, correct: boolean) {
  if (correct) {
    const streakCorrect = state.streakCorrect + 1;
    if (streakCorrect >= 3 && state.level < 4) {
      return { level: (state.level + 1) as Level, streakCorrect: 0, streakWrong: 0, dropped: false, bridge: null as string | null };
    }
    return { level: state.level, streakCorrect, streakWrong: 0, dropped: false, bridge: null as string | null };
  }
  const streakWrong = state.streakWrong + 1;
  if (streakWrong >= 2 && state.level > 1) {
    return { level: (state.level - 1) as Level, streakCorrect: 0, streakWrong: 0, dropped: true, bridge: BRIDGE_ON_DROP };
  }
  return { level: state.level, streakCorrect: 0, streakWrong, dropped: false, bridge: null as string | null };
}

export function initialLadder(): LadderState {
  return { level: 2, streakCorrect: 0, streakWrong: 0 };
}

export function classifyError(event: LearningEvent, conceptLevel: Level | null = null): ErrorFamily | null {
  if (event.notTaught) return null;
  if (event.confidence === 'guess') return 'guess';
  if (event.correct) return null;
  if (event.markedFamily) return event.markedFamily;
  if (event.timeMs < FAST_MS && (conceptLevel ?? 1) >= 3) return 'careless';
  if (event.confidence === 'sure') return 'concept_gap';
  return 'method';
}

export function sessionGate(marks: readonly (boolean | null)[]) {
  const marked = marks.filter((mark): mark is boolean => mark !== null);
  if (!marked.length) return { passed: true, ratio: 1, correct: 0, marked: 0, bridge: null as string | null };
  const correct = marked.filter(Boolean).length;
  const ratio = correct / marked.length;
  const passed = ratio >= SESSION_PASS_RATIO;
  return { passed, ratio, correct, marked: marked.length, bridge: passed ? null : SESSION_BRIDGE };
}

export function chapterBand(scores: readonly number[]): Band | null {
  if (!scores.length) return null;
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  if (average >= 0.75) return '75-100';
  if (average >= 0.5) return '50-75';
  if (average >= 0.25) return '25-50';
  return '0-25';
}

export function diagnosticEntry(results: readonly { correct: boolean; notTaught: boolean }[]) {
  const taught = results.filter((result) => !result.notTaught);
  // Skipping everything is not a repair signal: an all-skip diagnostic starts in the middle.
  if (!taught.length) return { level: 2 as Level, route: 'steady' as DiagnosticRoute };
  const notTaught = results.length - taught.length;
  if (notTaught >= Math.ceil(results.length / 2)) {
    return { level: 1 as Level, route: 'repair' as DiagnosticRoute };
  }
  const ratio = taught.filter((result) => result.correct).length / taught.length;
  if (ratio >= 0.8) return { level: 3 as Level, route: 'challenge' as DiagnosticRoute };
  if (ratio < 0.5) return { level: 1 as Level, route: 'repair' as DiagnosticRoute };
  return { level: 2 as Level, route: 'steady' as DiagnosticRoute };
}

export function pickLadderItem<T extends { conceptId: string; level: Level }>(
  items: readonly T[],
  ladders: readonly { conceptId: string; level: Level }[],
): T | null {
  if (!items.length) return null;
  const levelFor = (conceptId: string) => ladders.find((row) => row.conceptId === conceptId)?.level ?? 2;
  return [...items].sort((a, b) => Math.abs(a.level - levelFor(a.conceptId)) - Math.abs(b.level - levelFor(b.conceptId))
    || a.level - b.level)[0] ?? null;
}

export function clampLevel(value: number): Level {
  if (!Number.isFinite(value)) return 1;
  return Math.min(4, Math.max(1, Math.round(value))) as Level;
}
