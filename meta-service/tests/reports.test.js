import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, csvRow } from '../src/utils/csv.js';
import { dailyActivitySchema, alertHistorySchema } from '../src/modules/reports/report.validation.js';

test('csv: plain values pass through, null and undefined are empty', () => {
  assert.equal(csvCell('MAERSK ESSEX'), 'MAERSK ESSEX');
  assert.equal(csvCell(12.5), '12.5');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(undefined), '');
});

test('csv: commas, quotes and newlines are quoted, inner quotes doubled', () => {
  assert.equal(csvCell('Foo, Bar'), '"Foo, Bar"');
  assert.equal(csvCell('The "Lady"'), '"The ""Lady"""');
  assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
});

test('csv: strings that would run as spreadsheet formulas are defused, negative numbers are not', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(csvCell('-3+3'), "'-3+3");
  assert.equal(csvCell(-79.5), '-79.5');
});

test('csv: a row ends with CRLF', () => {
  assert.equal(csvRow(['a', null, 'b,c']), 'a,,"b,c"\r\n');
});

const check = (schema, query) => schema.validate({ query }).error?.details[0].message;
const isoDay = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

test('daily activity: needs a real, non-future YYYY-MM-DD date', () => {
  assert.equal(check(dailyActivitySchema, { date: '2026-11-01' }), undefined);
  assert.match(check(dailyActivitySchema, {}), /"query.date" is required/);
  assert.match(check(dailyActivitySchema, { date: '01/11/2026' }), /YYYY-MM-DD/);
  assert.match(check(dailyActivitySchema, { date: '2026-02-30' }), /not a valid date/);
  assert.match(check(dailyActivitySchema, { date: isoDay(2) }), /future/);
});

test('alert history: from <= to, at most 92 days inclusive', () => {
  assert.equal(check(alertHistorySchema, { from: '2026-08-01', to: '2026-10-31' }), undefined);
  assert.equal(check(alertHistorySchema, { from: '2026-10-05', to: '2026-10-05' }), undefined);
  assert.match(check(alertHistorySchema, { from: '2026-08-01', to: '2026-11-01' }), /limited to 92 days/);
  assert.match(check(alertHistorySchema, { from: '2026-10-10', to: '2026-10-09' }), /on or before/);
});

test('alert history: type, severity and status filters take comma-separated known values', () => {
  const range = { from: '2026-10-01', to: '2026-10-31' };
  const { value, error } = alertHistorySchema.validate({
    query: { ...range, type: 'speed, loitering,speed', severity: 'high,critical', status: 'open' }
  });
  assert.equal(error, undefined);
  assert.deepEqual(value.query.type, ['speed', 'loitering']);
  assert.deepEqual(value.query.severity, ['high', 'critical']);
  assert.deepEqual(value.query.status, ['open']);
  assert.equal(alertHistorySchema.validate({ query: { ...range, type: '' } }).value.query.type, undefined);
  assert.match(check(alertHistorySchema, { ...range, severity: 'urgent' }), /unknown value "urgent"/);
  assert.match(check(alertHistorySchema, { ...range, status: 'open,closed' }), /unknown value "closed"/);
});
