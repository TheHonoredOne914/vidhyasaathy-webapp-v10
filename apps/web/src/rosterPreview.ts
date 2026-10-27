import { parseRosterCsv } from '@vidhyasaathy/core/roster';

export type PreviewLine = {
  row: number;
  name: string;
  rollNumber: string;
  message: string | null;
};

// Preview repeats the import header rule so row numbers match the server. The import response is what is saved.
export function previewRoster(csv: string): { headerError: string | null; lines: PreviewLine[] } {
  if (!csv.trim()) return { headerError: null, lines: [] };
  const parsed = parseRosterCsv(csv);
  const records = [...parsed.records];
  const header = records.shift();
  const headerRow = header?.row ?? 1;
  const lines: PreviewLine[] = parsed.errors.map((error) => ({
    row: error.row,
    name: '',
    rollNumber: '',
    message: error.message,
  }));
  if (!header || header.fields.length !== 2 || !header.fields.includes('name') || !header.fields.includes('rollNumber')
    || parsed.errors.some((error) => error.row < headerRow)) {
    return {
      headerError: 'CSV header must contain exactly name,rollNumber (in either order).',
      lines,
    };
  }
  const nameIndex = header.fields.indexOf('name');
  const rollIndex = header.fields.indexOf('rollNumber');
  for (const record of records) {
    const name = record.fields[nameIndex] ?? '';
    const rollNumber = record.fields[rollIndex] ?? '';
    if (record.fields.length !== 2) {
      lines.push({ row: record.row, name, rollNumber, message: 'Expected exactly two CSV fields.' });
      continue;
    }
    const message = name.trim() && rollNumber.trim() ? null : 'Check the student name and roll number.';
    lines.push({ row: record.row, name, rollNumber, message });
  }
  lines.sort((left, right) => left.row - right.row);
  return { headerError: null, lines };
}
