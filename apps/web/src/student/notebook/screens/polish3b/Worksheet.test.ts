import { describe, expect, it } from 'vitest';
import type { QuestionView } from '../../../../assessment/present';
import { worksheetAnswer } from './Worksheet';

const base: QuestionView = { id: 'q', prompt: 'Question', kind: 'short_answer', options: [], left: [], right: [], answer: null };
describe('worksheet answers', () => {
  it('does not submit empty writing', () => { expect(worksheetAnswer(base, '  ', [])).toBeNull(); expect(worksheetAnswer(base, ' working ', [])).toBe('working'); });
  it('requires complete, distinct matches', () => {
    const view = { ...base, kind: 'match_pairs' as const, left: ['a', 'b'] };
    expect(worksheetAnswer(view, '', ['x'])).toBeNull();
    expect(worksheetAnswer(view, '', ['x', 'x'])).toBeNull();
    expect(worksheetAnswer(view, '', ['x', 'y'])).toEqual(['x', 'y']);
  });
});
