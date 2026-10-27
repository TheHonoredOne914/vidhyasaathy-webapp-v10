import { describe, expect, it } from 'vitest';
import { previewRoster } from './rosterPreview';

describe('previewRoster', () => {
  it('marks a blank name and keeps the physical row number', () => {
    const preview = previewRoster('name,rollNumber\nAsha Rao,01\n,2\n');
    expect(preview.headerError).toBeNull();
    expect(preview.lines).toEqual([
      { row: 2, name: 'Asha Rao', rollNumber: '01', message: null },
      { row: 3, name: '', rollNumber: '2', message: 'Check the student name and roll number.' },
    ]);
  });

  it('reports a header that is not name and rollNumber', () => {
    expect(previewRoster('student,roll\nAsha,01').headerError).toMatch(/name,rollNumber/);
  });
});
