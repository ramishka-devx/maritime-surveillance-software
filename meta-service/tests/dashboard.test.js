import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeWindow, countVesselBins } from '../src/modules/dashboard/dashboard.service.js';
import { DashboardModel } from '../src/modules/dashboard/dashboard.model.js';
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

test('vessel bins: union of hourly sets, finished hours fetched once', async (t) => {
  const calls = [];
  // Ship 'a' reports every hour, 'h<N>' only in hour N of the day.
  t.mock.method(DashboardModel, 'vesselsReporting', async (start) => {
    calls.push(start.getTime());
    return ['a', `h${start.getUTCHours()}`];
  });
  const now = Date.now();
  const hourly = rangeWindow('24h', now);
  const bins = await countVesselBins(hourly);
  assert.equal(bins.length, 24);
  assert.ok(bins.every((b) => b.n === 2));

  const before = calls.length;
  await countVesselBins(hourly);
  assert.equal(calls.length - before, 1, 'only the current hour is queried again');

  const daily = await countVesselBins(rangeWindow('7d', now));
  const today = daily.find((b) => b.bin === 6);
  assert.equal(today.n, 1 + new Date(now).getUTCHours() + 1, "'a' once plus one ship per hour so far");
});
