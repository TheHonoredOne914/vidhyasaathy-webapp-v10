import { describe, expect, it } from 'vitest';
import { retrieveModelBooks } from '../src/ai/retrieval.ts';

describe('Model textbook integration', () => {
  it('grounds science and social science in their own current chapter', () => {
    const science = retrieveModelBooks('Science', 'Motion', 'speed velocity distance time');
    expect(science.length).toBeGreaterThan(0);
    expect(science.every((chunk) => chunk.noteId.startsWith('science-exploration-'))).toBe(true);
    const society = retrieveModelBooks('Social Science', 'Atmosphere and Climate', 'atmosphere climate');
    expect(society.length).toBeGreaterThan(0);
    expect(society.every((chunk) => chunk.noteId.startsWith('understanding-society-'))).toBe(true);
    expect(new Set([...science, ...society].map((chunk) => chunk.id)).size).toBe(science.length + society.length);
  });
  it('does not leak unrelated books into another subject or chapter', () => {
    expect(retrieveModelBooks('English', 'Motion', 'speed')).toEqual([]);
    expect(retrieveModelBooks('Science', 'Unrelated chapter', 'speed')).toEqual([]);
    expect(retrieveModelBooks('Science', 'Motion', 'electrons nucleus')).toEqual([]);
  });
});
