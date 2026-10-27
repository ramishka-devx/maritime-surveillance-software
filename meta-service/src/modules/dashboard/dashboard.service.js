import { DashboardModel } from './dashboard.model.js';
import { AlertModel } from '../alerts/alert.model.js';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export const RANGES = {
  '24h': { bins: 24, stepMs: HOUR },
  '7d': { bins: 7, stepMs: DAY },
  '30d': { bins: 30, stepMs: DAY }
};

// "Active" = reported within this many hours; density looks back further so quiet sectors
// still show their traffic pattern.
const ACTIVE_HOURS = 1;
const DENSITY_HOURS = 24;
const DENSITY_COLS = 30;
const DENSITY_ROWS = 20;
// ais_positions keeps 7 days (partition-cron.js); older bins have no position history.
const POSITION_RETENTION_MS = 7 * DAY;

// UTC-aligned window ending with the current bin, plus the equal window before it.
export function rangeWindow(range, now = Date.now()) {
  const { bins, stepMs } = RANGES[range] || RANGES['24h'];
  const end = Math.floor(now / stepMs) * stepMs + stepMs;
  const start = end - bins * stepMs;
  return { bins, stepMs, start, end, prevStart: start - bins * stepMs };
}

// ponytail: per-process cache; Redis if meta-service scales out.
const CACHE_MS = 60 * 1000;
const cache = new Map();

export const DashboardService = {
  async summary({ range = '24h', sector_id } = {}) {
    const key = `${range}|${sector_id ?? ''}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

    const data = await this.build(range, sector_id);
    cache.set(key, { at: Date.now(), data });
    return data;
  },

  async build(range, sectorId) {
    const w = rangeWindow(range);
    const [start, end, prevStart] = [new Date(w.start), new Date(w.end), new Date(w.prevStart)];
    const stepSec = w.stepMs / 1000;

    const [alertBins, anomalyBins, vesselBins, previous, open, topZone, topFlagged, activeVessels, sectors, queue] =
      await Promise.all([
        DashboardModel.alertBins(start, end, stepSec),
        DashboardModel.anomalyBins(start, end, stepSec),
        DashboardModel.vesselBins(start, end, stepSec),
        DashboardModel.previousTotals(prevStart, start),
        DashboardModel.openAlerts(),
        DashboardModel.topZone(start, end),
        DashboardModel.topFlagged(start, end),
        DashboardModel.activeVessels(ACTIVE_HOURS),
        DashboardModel.sectorCounts(DENSITY_HOURS),
        AlertModel.list({ status: 'open', limit: 5 })
      ]);

    const oldestPositionMs = Date.now() - POSITION_RETENTION_MS;
    const buckets = Array.from({ length: w.bins }, (_, i) => {
      const binStart = w.start + i * w.stepMs;
      return {
        start: new Date(binStart).toISOString(),
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        anomalies: 0,
        incursions: 0,
        // null where the position history has already been dropped
        active_vessels: binStart + w.stepMs <= oldestPositionMs ? null : 0
      };
    });
    const inRange = (bin) => bin >= 0 && bin < w.bins;

    const byType = {};
    const totals = { high: 0, critical: 0, incursions: 0 };
    for (const { bin, severity, type, n } of alertBins) {
      byType[type] = (byType[type] || 0) + n;
      if (severity === 'critical' || severity === 'high') totals.high += n;
      if (severity === 'critical') totals.critical += n;
      if (type === 'geofence') totals.incursions += n;
      if (!inRange(bin)) continue;
      const b = buckets[bin];
      b[severity in b ? severity : 'low'] += n;
      if (type === 'geofence') b.incursions += n;
    }
    let anomalyTotal = 0;
    for (const { bin, n } of anomalyBins) {
      anomalyTotal += n;
      if (inRange(bin)) buckets[bin].anomalies += n;
    }
    for (const { bin, n } of vesselBins) {
      if (inRange(bin) && buckets[bin].active_vessels !== null) buckets[bin].active_vessels = n;
    }

    const densitySectorId = sectorId ?? sectors[0]?.id;
    const density = densitySectorId ? await this.density(densitySectorId) : null;

    return {
      range,
      window: { start: start.toISOString(), end: end.toISOString(), step_s: stepSec },
      kpis: {
        open_alerts: open.open,
        unassigned: open.unassigned,
        high: { value: totals.high, previous: previous.high },
        critical: { value: totals.critical, previous: previous.critical },
        anomalies: { value: anomalyTotal, previous: previous.anomalies },
        incursions: { value: totals.incursions, previous: previous.incursions, top_zone: topZone },
        active_vessels: activeVessels
      },
      buckets,
      by_type: Object.entries(byType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      top_flagged: topFlagged,
      queue: { total: queue.total, rows: queue.rows },
      sectors,
      density
    };
  },

  async density(sectorId) {
    const bounds = await DashboardModel.sectorBounds(sectorId);
    if (!bounds) return null;
    const cells = new Array(DENSITY_COLS * DENSITY_ROWS).fill(0);
    for (const { col, row, n } of await DashboardModel.densityCells(sectorId, DENSITY_HOURS, DENSITY_COLS, DENSITY_ROWS)) {
      // width_bucket puts values on the far edge in bucket count + 1; fold them in.
      const c = Math.min(Math.max(col, 0), DENSITY_COLS - 1);
      const r = Math.min(Math.max(row, 0), DENSITY_ROWS - 1);
      cells[r * DENSITY_COLS + c] += n;
    }
    return { sector_id: sectorId, bounds, cols: DENSITY_COLS, rows: DENSITY_ROWS, hours: DENSITY_HOURS, cells };
  }
};
