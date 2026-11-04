import { badRequest, notFound } from '../../utils/errorHandler.js';
import { DetectionSettingsModel } from './detection-settings.model.js';
import { DEFAULTS, SETTINGS, crossCheck } from './detection-settings.registry.js';

// AnomalyService reads settings on every anomaly; keep a short per-process cache.
const CACHE_MS = 30 * 1000;
let cache = null;

function merge(rows) {
  const values = { ...DEFAULTS };
  for (const row of rows) {
    if (row.key in SETTINGS) values[row.key] = row.value;
  }
  return values;
}

export const DetectionSettingsService = {
  // { key: value } with defaults for anything not stored.
  async values() {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.values;
    const values = merge(await DetectionSettingsModel.listSettings());
    cache = { at: Date.now(), values };
    return values;
  },

  async get() {
    const [rows, thresholds, history] = await Promise.all([
      DetectionSettingsModel.listSettings(),
      DetectionSettingsModel.listThresholds(),
      DetectionSettingsModel.recentChanges()
    ]);
    const stored = new Map(rows.map((r) => [r.key, r]));
    const values = merge(rows);
    const settings = Object.entries(SETTINGS).map(([key, s]) => ({
      key,
      group: s.group,
      label: s.label,
      help: s.help,
      unit: s.unit ?? null,
      default: s.default,
      value: values[key],
      updated_at: stored.get(key)?.updated_at ?? null,
      updated_by_name: stored.get(key)?.updated_by_name ?? null
    }));
    return { values, settings, thresholds, history };
  },

  // changes: { key: value }. Returns [{ key, from, to }] for the audit log.
  async update(changes, userId) {
    const current = await this.values();
    const next = { ...current };
    for (const [key, value] of Object.entries(changes)) {
      const def = SETTINGS[key];
      if (!def) throw badRequest(`Unknown setting "${key}"`);
      const { error, value: valid } = def.schema.validate(value);
      if (error) throw badRequest(`${def.label}: ${error.message.replace('"value" ', '')}`);
      next[key] = valid;
    }
    const problem = crossCheck(next);
    if (problem) throw badRequest(problem);

    const diff = Object.keys(changes)
      .filter((key) => next[key] !== current[key])
      .map((key) => ({ key, from: current[key], to: next[key] }));
    for (const { key, to } of diff) await DetectionSettingsModel.setSetting(key, to, userId);
    cache = null;
    return diff;
  },

  async setOverride(type_group, p99_override, userId) {
    const before = await DetectionSettingsModel.getThreshold(type_group);
    if (!before) throw notFound('Vessel type group not found');
    const after = await DetectionSettingsModel.setOverride(type_group, p99_override, userId);
    return { threshold: after, change: { type_group, label: before.label, from: before.p99_override, to: p99_override } };
  },

  async reportComputed(thresholds) {
    await DetectionSettingsModel.reportComputed(thresholds);
  }
};
