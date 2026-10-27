import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeWindow } from '../src/modules/dashboard/dashboard.service.js';
import { ANOMALY_ALERT } from '../src/modules/anomalies/anomaly.service.js';

const at = (iso) => new Date(iso).getTime();

test('24h window: 24 hourly UTC bins ending with the current hour, previous window before it', () => {
  const w = rangeWindow('24h', at('2026-10-27T17:42:10Z'));
  assert.equal(w.bins, 24);
  assert.equal(new Date(w.end).toISOString(), '2026-10-27T18:00:00.000Z');
  assert.equal(new Date(w.start).toISOString(), '2026-10-26T18:00:00.000Z');
  assert.equal(new Date(w.prevStart).toISOString(), '2026-10-25T18:00:00.000Z');
});

test('7d and 30d windows use UTC-midnight daily bins including today', () => {
  const now = at('2026-10-27T00:00:00Z');
  const week = rangeWindow('7d', now);
  assert.equal(new Date(week.end).toISOString(), '2026-10-28T00:00:00.000Z');
  assert.equal(new Date(week.start).toISOString(), '2026-10-21T00:00:00.000Z');
  const month = rangeWindow('30d', now);
  assert.equal(month.bins, 30);
  assert.equal(month.end - month.start, 30 * 24 * 3600 * 1000);
});

test('unknown range falls back to 24h', () => {
  assert.equal(rangeWindow('1y', at('2026-10-27T00:00:00Z')).bins, 24);
});

test('anomalies raise alerts of their own type, not all as speed', () => {
  assert.equal(ANOMALY_ALERT.speed.type, 'speed');
  assert.equal(ANOMALY_ALERT.route.type, 'route_deviation');
  assert.equal(ANOMALY_ALERT.behavoir.type, 'loitering');
  assert.equal(ANOMALY_ALERT.loitering.type, 'loitering');
});
