import { parseRosterCsv } from '@vidhyasaathy/core/roster';

export type PreviewLine = {
  row: number;
  name: string;
  rollNumber: string;
  phone: string;
  message: string | null;
};

// Preview matches the import header rule so row numbers match the server.
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
    phone: '',
    message: error.message,
  }));
  if (!header || header.fields.length !== 3 || !['name', 'rollNumber', 'phone'].every((field) => header.fields.includes(field))
    || parsed.errors.some((error) => error.row < headerRow)) {
    return {
      headerError: 'CSV header must contain exactly name,rollNumber,phone (in any order).',
      lines,
    };
  }
  const nameIndex = header.fields.indexOf('name');
  const rollIndex = header.fields.indexOf('rollNumber');
  const phoneIndex = header.fields.indexOf('phone');
  for (const record of records) {
    const name = record.fields[nameIndex] ?? '';
    const rollNumber = record.fields[rollIndex] ?? '';
    const phone = record.fields[phoneIndex] ?? '';
    if (record.fields.length !== 3) {
      lines.push({ row: record.row, name, rollNumber, phone, message: 'Expected exactly three CSV fields.' });
      continue;
    }
    const message = name.trim() && rollNumber.trim() && phone.trim() ? null : 'Check the student name, roll number, and parent phone.';
    lines.push({ row: record.row, name, rollNumber, phone, message });
  }
  lines.sort((left, right) => left.row - right.row);
  return { headerError: null, lines };
}
