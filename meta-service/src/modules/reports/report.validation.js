import Joi from 'joi';
import { ALERT_STATUSES, ALERT_TYPES } from '../alerts/alert.validation.js';

// A quarter; the report's 5 s first-row timeout still guards slow queries.
export const MAX_RANGE_DAYS = 92;
export const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const DAY_MS = 24 * 3600 * 1000;

// A real calendar day (UTC), not in the future. Kept as a string so it reaches SQL as ::date.
const isoDay = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const t = Date.parse(`${value}T00:00:00Z`);
    if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== value) return helpers.error('any.invalid');
    if (t > Date.now()) return helpers.message('{{#label}} cannot be in the future');
    return value;
  })
  .messages({
    'string.pattern.base': '{{#label}} must be a date in YYYY-MM-DD format',
    'any.invalid': '{{#label}} is not a valid date'
  });

export const dailyActivitySchema = Joi.object({
  query: Joi.object({
    date: isoDay.required()
  })
});

// Optional filter: one value or a comma-separated list ("high,critical"), turned into an array.
const listOf = (allowed) =>
  Joi.string()
    .custom((value, helpers) => {
      const items = [...new Set(value.split(',').map((s) => s.trim()).filter(Boolean))];
      const bad = items.find((s) => !allowed.includes(s));
      if (bad) return helpers.message(`{{#label}} has an unknown value "${bad}" (allowed: ${allowed.join(', ')})`);
      return items;
    })
    .empty('');

export const alertHistorySchema = Joi.object({
  query: Joi.object({
    from: isoDay.required(),
    to: isoDay.required(),
    type: listOf(ALERT_TYPES),
    severity: listOf(ALERT_SEVERITIES),
    status: listOf(ALERT_STATUSES)
  }).custom((q, helpers) => {
    const days = (Date.parse(q.to) - Date.parse(q.from)) / DAY_MS + 1;
    if (days < 1) return helpers.message('"from" must be on or before "to"');
    if (days > MAX_RANGE_DAYS) {
      return helpers.message(`The date range is limited to ${MAX_RANGE_DAYS} days. Narrow the range and try again.`);
    }
    return q;
  })
});
