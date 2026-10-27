import { describe, expect, it } from 'vitest';
import { parseRosterCsv } from './roster.ts';

describe('roster CSV', () => {
  it('supports BOM, CRLF, quoted commas, escaped quotes and multiline fields', () => {
    expect(parseRosterCsv('\uFEFFname,rollNumber\r\n"Test, ""Student""",01\r\n"Two\nlines",02')).toEqual({
      records: [
        { row: 1, fields: ['name', 'rollNumber'] },
        { row: 2, fields: ['Test, "Student"', '01'] },
        { row: 3, fields: ['Two\nlines', '02'] },
      ], errors: [],
    });
  });

  it('reports physical row numbers, skips blank lines, and recovers after bad quoting', () => {
    expect(parseRosterCsv('name,rollNumber\n\nbad"name,1\nValid,2\n"Closed"junk,3\n')).toEqual({
      records: [{ row: 1, fields: ['name', 'rollNumber'] }, { row: 4, fields: ['Valid', '2'] }],
      errors: [{ row: 3, message: 'Invalid CSV quoting.' }, { row: 5, message: 'Invalid CSV quoting.' }],
    });
    expect(parseRosterCsv('name,rollNumber\n"not closed,1').errors).toEqual([
      { row: 2, message: 'Unterminated quoted CSV field.' },
    ]);
  });
});
