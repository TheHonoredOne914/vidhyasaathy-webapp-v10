export interface CsvRecord {
  row: number;
  fields: string[];
}

export interface CsvError {
  row: number;
  message: string;
}

export function parseRosterCsv(csv: string): { records: CsvRecord[]; errors: CsvError[] } {
  const records: CsvRecord[] = [];
  const errors: CsvError[] = [];
  const source = csv.replace(/^\uFEFF/, '');
  let fields: string[] = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;
  let invalid = false;
  let line = 1;
  let row = 1;

  function finishRow() {
    fields.push(field);
    if (invalid) errors.push({ row, message: 'Invalid CSV quoting.' });
    else if (fields.length > 1 || fields[0]?.trim()) records.push({ row, fields });
    fields = [];
    field = '';
    closedQuote = false;
    invalid = false;
    row = line + 1;
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '\r' || character === '\n') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      if (quoted) field += '\n';
      else finishRow();
      line += 1;
      continue;
    }
    if (invalid) continue;
    if (quoted) {
      if (character !== '"') field += character;
      else if (source[index + 1] === '"') { field += '"'; index += 1; }
      else { quoted = false; closedQuote = true; }
    } else if (character === ',') {
      fields.push(field);
      field = '';
      closedQuote = false;
    } else if (character === '"' && field === '' && !closedQuote) {
      quoted = true;
    } else if (character === '"' || closedQuote) {
      invalid = true;
    } else {
      field += character;
    }
  }
  if (quoted) errors.push({ row, message: 'Unterminated quoted CSV field.' });
  else if (field || fields.length || invalid || closedQuote) finishRow();
  return { records, errors };
}
