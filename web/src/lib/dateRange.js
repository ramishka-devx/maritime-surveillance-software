// Report date ranges are UTC days as YYYY-MM-DD strings, matching meta-service
// (modules/reports/report.validation.js: inclusive, at most MAX_RANGE_DAYS, no future days).
export const MAX_RANGE_DAYS = 92;
const DAY_MS = 24 * 3600 * 1000;

export const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
export const todayUtc = () => isoDay(Date.now());
export const shiftDay = (day, n) => isoDay(Date.parse(day) + n * DAY_MS);
export const spanDays = (from, to) => (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;

export const RANGE_PRESETS = [
  { id: 'today', label: 'Today', range: (t) => ({ from: t, to: t }) },
  { id: '7d', label: 'Last 7 days', range: (t) => ({ from: shiftDay(t, -6), to: t }) },
  { id: '30d', label: 'Last 30 days', range: (t) => ({ from: shiftDay(t, -29), to: t }) },
  { id: 'month', label: 'This month', range: (t) => ({ from: `${t.slice(0, 8)}01`, to: t }) },
  { id: '90d', label: 'Last 90 days', range: (t) => ({ from: shiftDay(t, -89), to: t }) },
];

export function presetRange(id, today = todayUtc()) {
  return (RANGE_PRESETS.find((p) => p.id === id) || RANGE_PRESETS[1]).range(today);
}

// What's wrong with a range, or null when it's valid.
export function rangeProblem(from, to, today = todayUtc()) {
  if (!from || !to) return 'Choose both dates.';
  if (from > today || to > today) return 'Dates can’t be in the future.';
  if (from > to) return 'The start date must be on or before the end date.';
  if (spanDays(from, to) > MAX_RANGE_DAYS) return `Choose a range of ${MAX_RANGE_DAYS} days or less.`;
  return null;
}
