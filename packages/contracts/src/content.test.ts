import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PublicItemSchema, SaveItemSchema, SaveLearningSessionSchema, UploadFileSchema } from './index.ts';

const base = { conceptId: randomUUID(), prompt: 'Which value?', difficulty: 1, sourceRef: null };
describe('content contracts', () => {
  it('validates every shared item format', () => {
    for (const item of [
      { ...base, type: 'mcq', options: ['one', 'two'], answer: 'one' },
      { ...base, type: 'match_pairs', pairs: [{ left: '1', right: 'one' }, { left: '2', right: 'two' }] },
      { ...base, type: 'short_answer', acceptedAnswers: ['one'] },
      { ...base, type: 'flashcard', answer: 'one' },
    ]) expect(SaveItemSchema.safeParse(item).success).toBe(true);
    expect(SaveItemSchema.safeParse({ ...base, type: 'mcq', options: ['one', 'two'], answer: 'three' }).success).toBe(false);
  });
  it('requires slides and a check, and rejects client-controlled progress', () => {
    const input = {
      sectionId: randomUUID(), title: 'Study',
      slides: [{ conceptId: base.conceptId, title: 'Read', body: 'Read this note.', noteId: null }],
      check: [{ ...base, type: 'flashcard', answer: 'one' }],
    };
    expect(SaveLearningSessionSchema.safeParse(input).success).toBe(true);
    expect(SaveLearningSessionSchema.safeParse({ ...input, slides: [] }).success).toBe(false);
    expect(SaveLearningSessionSchema.safeParse({ ...input, check: [] }).success).toBe(false);
    expect(SaveLearningSessionSchema.safeParse({ ...input, completed: true }).success).toBe(false);
  });
  it('rejects active files, traversal, malformed base64 and leaked answers', () => {
    const upload = { filename: 'note.txt', contentType: 'text/plain', dataBase64: 'bm90ZQ==' };
    expect(UploadFileSchema.safeParse(upload).success).toBe(true);
    for (const change of [{ filename: '../note.txt' }, { filename: 'C:\\note.txt' }, { contentType: 'image/svg+xml' }, { dataBase64: 'bad!' }]) {
      expect(UploadFileSchema.safeParse({ ...upload, ...change }).success).toBe(false);
    }
    expect(PublicItemSchema.safeParse({ ...base, id: randomUUID(), position: 0, type: 'flashcard', answer: 'secret' }).success).toBe(false);
    expect(PublicItemSchema.safeParse({ ...base, id: randomUUID(), position: 0, type: 'flashcard' }).success).toBe(true);
  });
});
