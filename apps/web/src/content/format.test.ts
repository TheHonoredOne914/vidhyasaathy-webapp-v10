import { describe, expect, it } from 'vitest';
import { chapterStatusLabel, contentStateLabel, fileSize, sessionProgressLabel } from './format';

describe('content labels', () => {
  it('names chapter progress in plain language', () => {
    expect(chapterStatusLabel('not_started')).toBe('Not started');
    expect(chapterStatusLabel('in_progress')).toBe('In progress');
    expect(chapterStatusLabel('completed')).toBe('Completed');
  });

  it('shows a future release separately from a draft', () => {
    expect(contentStateLabel('draft', null, 1_000)).toBe('Draft');
    expect(contentStateLabel('published', 500, 1_000)).toBe('Published');
    expect(contentStateLabel('published', 2_000, 1_000)).toMatch(/^Releases /);
  });

  it('describes session progress from the server record', () => {
    expect(sessionProgressLabel(null, 'draft')).toBe('Draft');
    expect(sessionProgressLabel({ viewedSlides: 1, totalSlides: 3, checkAvailable: false, completed: false }, 'published')).toBe('Slide 1 of 3');
    expect(sessionProgressLabel({ viewedSlides: 3, totalSlides: 3, checkAvailable: true, completed: true }, 'published')).toBe('Completed');
  });

  it('formats an attachment size', () => {
    expect(fileSize(12)).toBe('12 bytes');
    expect(fileSize(1024)).toBe('1 KB');
  });
});
