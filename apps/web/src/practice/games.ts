import type { GameId, PublicItem } from '@vidhyasaathy/contracts';

export const PRACTICE_GAMES: readonly { id: GameId; title: string; detail: string }[] = [
  { id: 'quick_revision_quiz', title: 'Quick revision', detail: 'New questions, then a review from an earlier week when one is due.' },
  { id: 'timed_concept_challenge', title: 'Timed concept challenge', detail: 'Sixty seconds. The clock stops new answers.' },
  { id: 'mcq_rush', title: 'Multiple choice rush', detail: 'Multiple choice only, for sixty seconds.' },
  { id: 'match_the_concept', title: 'Match the concept', detail: 'Pair each prompt with one value.' },
  { id: 'chapter_progress_challenge', title: 'Chapter progress', detail: 'Released questions from this chapter. Not required.' },
];

export function gameCopy(id: GameId): { title: string; detail: string } {
  const found = PRACTICE_GAMES.find((game) => game.id === id);
  if (!found) throw new Error('Unknown game.');
  return found;
}

export function kindLabel(kind: 'new' | 'review'): string {
  return kind === 'review' ? 'Review from an earlier week' : 'New question';
}

export function draftAnswer(item: PublicItem, choice: string, pairs: readonly string[]): string | string[] | null {
  if (item.type === 'mcq') return choice || null;
  if (item.type === 'match_pairs') {
    if (pairs.length !== item.left.length || pairs.some((value) => !value) || new Set(pairs).size !== pairs.length) return null;
    return [...pairs];
  }
  const text = choice.trim();
  return text || null;
}
