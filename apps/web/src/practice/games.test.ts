import { describe, expect, it } from 'vitest';
import type { PublicItem } from '@vidhyasaathy/contracts';
import { draftAnswer, kindLabel, PRACTICE_GAMES } from './games';

const base = { id: '11111111-1111-4111-8111-111111111111', conceptId: '22222222-2222-4222-8222-222222222222', prompt: 'A half', difficulty: 1, position: 0, sourceRef: null };

describe('practice games', () => {
  it('lists the five item-schema games', () => {
    expect(PRACTICE_GAMES.map((game) => game.id)).toEqual([
      'quick_revision_quiz', 'timed_concept_challenge', 'mcq_rush', 'match_the_concept', 'chapter_progress_challenge',
    ]);
  });

  it('labels new and review items from the server mix', () => {
    expect(kindLabel('new')).toBe('New question');
    expect(kindLabel('review')).toBe('Review from an earlier week');
  });

  it('builds an answer only when the question is complete', () => {
    const mcq = { ...base, type: 'mcq', options: ['1/2', '1/3'] } satisfies PublicItem;
    const match = { ...base, type: 'match_pairs', left: ['half', 'third'], right: ['1/2', '1/3'] } satisfies PublicItem;
    expect(draftAnswer(mcq, '', [])).toBeNull();
    expect(draftAnswer(mcq, '1/2', [])).toBe('1/2');
    expect(draftAnswer(match, '', ['1/2', '1/2'])).toBeNull();
    expect(draftAnswer(match, '', ['1/2', '1/3'])).toEqual(['1/2', '1/3']);
  });
});
