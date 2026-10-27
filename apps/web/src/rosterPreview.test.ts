import { describe, expect, it } from 'vitest';
import { previewRoster } from './rosterPreview';

describe('previewRoster', () => {
  it('marks a blank name and keeps the physical row number', () => {
    const preview = previewRoster('name,rollNumber,phone\nAsha Rao,01,9876543210\n,2,9876543211\n');
    expect(preview.headerError).toBeNull();
    expect(preview.lines).toEqual([
      { row: 2, name: 'Asha Rao', rollNumber: '01', phone: '9876543210', message: null },
      { row: 3, name: '', rollNumber: '2', phone: '9876543211', message: 'Check the student name, roll number, and parent phone.' },
    ]);
  });

  it('reports a header that is not name, rollNumber, and phone', () => {
    expect(previewRoster('student,roll\nAsha,01').headerError).toMatch(/name,rollNumber,phone/);
  });

  it('flags a two-column row as invalid', () => {
    const preview = previewRoster('name,rollNumber,phone\nAsha Rao,01\n');
    expect(preview.headerError).toBeNull();
    expect(preview.lines[0]?.message).toMatch(/three CSV fields|parent phone/i);
  });
});
