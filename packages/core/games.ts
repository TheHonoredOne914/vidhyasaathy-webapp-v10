import type { GameId, PublicItem, SubmitPracticeAttempt } from '@vidhyasaathy/contracts';

type ItemType = PublicItem['type'];
export interface GameConfig { startedAt: number; durationMs?: number }
export interface GameAnswer { event: SubmitPracticeAttempt; conceptId: string; correct: boolean | null }
export interface GameState {
  readonly gameId: GameId;
  readonly items: readonly PublicItem[];
  readonly startedAt: number;
  readonly deadline: number | null;
  readonly answers: readonly GameAnswer[];
}
export interface GameResult {
  total: number; answered: number; correct: number; pendingReview: number; completed: boolean;
  attempts: readonly GameAnswer[];
}
export interface GameModule {
  readonly id: GameId;
  readonly acceptedItemTypes: readonly ItemType[];
  start(items: readonly PublicItem[], config: GameConfig): GameState;
  onAnswer(state: GameState, event: SubmitPracticeAttempt, correct: boolean | null, now?: number): GameState;
  result(state: GameState, now?: number): GameResult;
}

function module(id: GameId, acceptedItemTypes: readonly ItemType[], timed = false): GameModule {
  const checkState = (state: GameState) => { if (state.gameId !== id) throw new Error('Wrong game state.'); };
  return {
    id, acceptedItemTypes,
    start(items, config) {
      const duration = config.durationMs ?? (timed ? 60000 : null);
      if (!Number.isSafeInteger(config.startedAt) || config.startedAt < 0
        || (duration !== null && (!Number.isSafeInteger(duration) || duration < 1 || duration > 86400000
          || !Number.isSafeInteger(config.startedAt + duration)))) throw new RangeError('Invalid game clock.');
      if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error('Duplicate game item.');
      if (items.some((item) => !acceptedItemTypes.includes(item.type))) throw new Error('Unsupported game item.');
      return { gameId: id, items: structuredClone(items), startedAt: config.startedAt,
        deadline: duration === null ? null : config.startedAt + duration, answers: [] };
    },
    onAnswer(state, event, correct, now = event.clientTs) {
      checkState(state);
      const existing = state.answers.find((answer) => answer.event.clientEventId === event.clientEventId);
      if (existing) {
        const old = existing.event;
        if (old.itemId !== event.itemId || old.clientTs !== event.clientTs || old.timeMs !== event.timeMs
          || JSON.stringify(old.answer) !== JSON.stringify(event.answer) || existing.correct !== correct) throw new Error('Conflicting game event.');
        return state;
      }
      if (!Number.isSafeInteger(now) || now < state.startedAt || (state.deadline !== null && now >= state.deadline)) throw new Error('Game clock expired or invalid.');
      const item = state.items[state.answers.length];
      if (!item || item.id !== event.itemId) throw new Error('Answer the current game item.');
      // Server marking is supplied by the caller; no answer key or alternate question model lives here.
      return { ...state, answers: [...state.answers, { event: structuredClone(event), conceptId: item.conceptId, correct }] };
    },
    result(state, now = state.startedAt) {
      checkState(state);
      return { total: state.items.length, answered: state.answers.length, correct: state.answers.filter((answer) => answer.correct === true).length,
        pendingReview: state.answers.filter((answer) => answer.correct === null).length,
        completed: state.answers.length === state.items.length || (state.deadline !== null && now >= state.deadline),
        attempts: structuredClone(state.answers) };
    },
  };
}

const allTypes: readonly ItemType[] = ['mcq', 'match_pairs', 'short_answer', 'flashcard'];
export const gameModules: Readonly<Record<GameId, GameModule>> = {
  timed_concept_challenge: module('timed_concept_challenge', allTypes, true),
  mcq_rush: module('mcq_rush', ['mcq'], true),
  quick_revision_quiz: module('quick_revision_quiz', allTypes),
  match_the_concept: module('match_the_concept', ['match_pairs']),
  chapter_progress_challenge: module('chapter_progress_challenge', allTypes),
};
