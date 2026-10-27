import { describe, expect, it } from 'vitest';
import { fileContentType, filePayload, releaseInstant } from './files';

describe('lesson files', () => {
  it('accepts pdf, png, jpeg, and text', () => {
    expect(fileContentType('notes.pdf', '')).toBe('application/pdf');
    expect(fileContentType('photo.jpg', 'image/jpg')).toBe('image/jpeg');
    expect(fileContentType('page.html', 'text/html')).toBeNull();
  });

  it('reads a local release time', () => {
    expect(releaseInstant('')).toBeNull();
    expect(releaseInstant('not-a-date')).toBeNull();
    const value = '2026-10-25T18:30';
    expect(releaseInstant(value)).toBe(new Date(value).getTime());
  });

  it('encodes a text file as canonical base64', async () => {
    const payload = await filePayload(new File(['Hello'], 'note.txt', { type: 'text/plain' }));
    expect(payload.contentType).toBe('text/plain');
    expect(Buffer.from(payload.dataBase64, 'base64').toString()).toBe('Hello');
    await expect(filePayload(new File(['x'], 'a.html', { type: 'text/html' }))).rejects.toThrow('Use a PDF');
  });
});
