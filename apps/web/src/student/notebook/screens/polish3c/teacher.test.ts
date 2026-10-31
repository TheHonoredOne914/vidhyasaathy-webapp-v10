import { describe, expect, it } from 'vitest';
import { sectionConcepts } from './teacher';

describe('teacher concept summary', () => {
  it('keeps practice needs from every section without duplicating concepts', () => {
    expect(sectionConcepts([
      { concepts: [{ conceptId: 'a', needingPractice: 3 }, { conceptId: 'b', needingPractice: 2 }] },
      { concepts: [{ conceptId: 'a', needingPractice: 0 }, { conceptId: 'b', needingPractice: 4 }] },
    ])).toEqual([{ conceptId: 'a', needingPractice: 3 }, { conceptId: 'b', needingPractice: 6 }]);
  });
});
