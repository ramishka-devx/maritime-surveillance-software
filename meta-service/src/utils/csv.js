// RFC 4180 CSV for report downloads.

// Excel needs the BOM to read UTF-8 (non-ASCII ship names).
export const CSV_BOM = '﻿';

// Ship names come from AIS broadcasts anyone can transmit; a leading =, +, -, @ would run
// as a spreadsheet formula. Only strings are guarded, so negative numbers stay numbers.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === 'string' && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(values) {
  return `${values.map(csvCell).join(',')}\r\n`;
}
