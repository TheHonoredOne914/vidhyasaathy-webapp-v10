import { expect, it } from 'vitest';
import { defaultChapter, defaultSubject } from './chapterContext';

const subjects = [{ id: 'bio', name: 'Biology' }, { id: 'phy', name: 'Physics' }, { id: 'math', name: 'Mathematics' }];
it('prefers the current subject, otherwise Physics, not list order', () => {
  expect(defaultSubject(subjects, 'Mathematics')?.id).toBe('math');
  expect(defaultSubject(subjects)?.id).toBe('phy');
});
it('prefers the current chapter, otherwise Motion', () => {
  const chapters = [{ id: 'a', title: 'Other chapter' }, { id: 'm', title: 'Motion' }];
  expect(defaultChapter(chapters)?.id).toBe('m');
  expect(defaultChapter(chapters, 'Other chapter')?.id).toBe('a');
  expect(defaultChapter([])).toBeUndefined();
});
