import { expect, it } from 'vitest';
import { pickNoteVariant, prereqIsWeak, revisionDueAt } from './learn.ts';

it('picks the simple note for a fragile level and for Explain simpler', () => {
  expect(pickNoteVariant(null)).toBe('standard');
  expect(pickNoteVariant(1)).toBe('simple');
  expect(pickNoteVariant(2)).toBe('standard');
  expect(pickNoteVariant(3)).toBe('stretch');
  expect(pickNoteVariant(4)).toBe('stretch');
  expect(pickNoteVariant(4, true)).toBe('simple');
  expect(pickNoteVariant(null, true)).toBe('simple');
});

it('schedules revision one, three and seven days out', () => {
  expect(revisionDueAt(1_000)).toEqual([
    { days: 1, dueAt: 1_000 + 86_400_000 },
    { days: 3, dueAt: 1_000 + 3 * 86_400_000 },
    { days: 7, dueAt: 1_000 + 7 * 86_400_000 },
  ]);
});

it('treats a misconception or a fragile prerequisite as weak', () => {
  expect(prereqIsWeak(null)).toBe(false);
  expect(prereqIsWeak({ masteryLevel: null, misconception: false })).toBe(false);
  expect(prereqIsWeak({ masteryLevel: 1, misconception: false })).toBe(true);
  expect(prereqIsWeak({ masteryLevel: 3, misconception: true })).toBe(true);
});
