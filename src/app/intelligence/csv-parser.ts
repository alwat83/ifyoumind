export interface CsvTable {
  headers: string[];
  rows: string[][];
}

export function parseCsv(text: string): CsvTable {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') pushField();
    else if (char === '\n') pushRow();
    else if (char !== '\r') field += char;
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (field.length || row.length) pushRow();
  if (!rows.length) throw new Error('CSV is empty.');

  const headers = rows[0].map((header) => header.trim());
  if (!headers.length || headers.some((header) => !header)) {
    throw new Error('CSV header row contains an empty column name.');
  }
  if (new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) {
    throw new Error('CSV header names must be unique.');
  }

  const width = headers.length;
  const dataRows = rows.slice(1).map((dataRow, index) => {
    if (dataRow.length !== width) {
      throw new Error(`Row ${index + 2} has ${dataRow.length} columns; expected ${width}.`);
    }
    return dataRow;
  });

  return { headers, rows: dataRows };
}

export function suggestColumn(headers: string[], aliases: string[]): string {
  const normalized = headers.map((header) => ({
    header,
    normalized: header.toLowerCase().replace(/[^a-z0-9]+/g, ''),
  }));

  for (const alias of aliases) {
    const target = alias.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const exact = normalized.find((candidate) => candidate.normalized === target);
    if (exact) return exact.header;
  }

  return '';
}
