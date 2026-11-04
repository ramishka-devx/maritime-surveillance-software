import Joi from 'joi';

// Every admin-editable detector setting (REQ-F-047). Defaults match the rows the
// DetectionPipeline migration seeds; analytic-service falls back to the same values.
export const SETTINGS = {
  'speed.score_threshold': {
    group: 'speed',
    label: 'Alert score threshold',
    help: 'Positions above their vessel type’s p99 speed raise an alert when the IsolationForest score is at least this. Ordinary speeds score about 0.45, just over p99 about 0.67, and clear outliers about 0.76.',
    default: 0.7,
    schema: Joi.number().min(0.5).max(1)
  },
  'speed.warning_threshold': {
    group: 'speed',
    label: 'Warning score threshold',
    help: 'Scores from here up to the alert threshold are only logged for analyst review (UC-004.AC.2).',
    default: 0.65,
    schema: Joi.number().min(0.5).max(1)
  },
  'speed.high_severity_score': {
    group: 'speed',
    label: 'High-severity score',
    help: 'Speed alerts at or above this score are High severity; below it, Medium.',
    default: 0.75,
    schema: Joi.number().min(0.5).max(1)
  },
  'speed.min_group_samples': {
    group: 'speed',
    label: 'Minimum samples per vessel type',
    help: 'A vessel type needs this many positions before its own p99 is used; until then the fallback applies.',
    default: 200,
    schema: Joi.number().integer().min(20).max(100000)
  },
  'speed.fallback_p99_kn': {
    group: 'speed',
    label: 'Fallback p99 speed (kn)',
    help: 'Used for vessel types without enough data (TBD-006). Empty means the p99 of all vessels.',
    default: null,
    unit: 'kn',
    schema: Joi.number().min(1).max(100).allow(null)
  },
  'speed.refit_minutes': {
    group: 'speed',
    label: 'Model refit interval (min)',
    help: 'How often analytic-service recomputes the p99 thresholds and refits the model from recent positions.',
    default: 15,
    unit: 'min',
    schema: Joi.number().integer().min(1).max(1440)
  },
  'alerts.cooldown_minutes': {
    group: 'alerts',
    label: 'Alert cooldown (min)',
    help: 'Repeat detections of the same type for a vessel with an unresolved alert this recent are added to that alert instead of raising a new one.',
    default: 30,
    unit: 'min',
    schema: Joi.number().integer().min(0).max(1440)
  },
  'loitering.radius_m': {
    group: 'loitering',
    label: 'Loitering radius (m)',
    help: 'A vessel loiters when every position over the window stays within this distance of the track centre.',
    default: 1000,
    unit: 'm',
    schema: Joi.number().min(50).max(20000)
  },
  'loitering.min_minutes': {
    group: 'loitering',
    label: 'Loitering minimum duration (min)',
    help: 'How long the vessel must stay within the radius.',
    default: 60,
    unit: 'min',
    schema: Joi.number().integer().min(5).max(1440)
  },
  'loitering.max_sog_kn': {
    group: 'loitering',
    label: 'Loitering maximum average speed (kn)',
    help: 'Average speed over the window must be below this.',
    default: 2,
    unit: 'kn',
    schema: Joi.number().min(0).max(10)
  },
  'loitering.cooldown_minutes': {
    group: 'loitering',
    label: 'Loitering cooldown (min)',
    help: 'At most one loitering detection per vessel in this period.',
    default: 180,
    unit: 'min',
    schema: Joi.number().integer().min(5).max(10080)
  }
};

export const DEFAULTS = Object.fromEntries(Object.entries(SETTINGS).map(([key, s]) => [key, s.default]));

// Returns an error message when a full set of values is inconsistent, otherwise null.
export function crossCheck(values) {
  const score = values['speed.score_threshold'];
  if (values['speed.warning_threshold'] > score) return 'The warning threshold must not exceed the alert score threshold.';
  if (values['speed.high_severity_score'] < score) return 'The high-severity score must be at least the alert score threshold.';
  return null;
}
