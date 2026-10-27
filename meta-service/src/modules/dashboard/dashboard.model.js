import { query } from '../../config/db.config.js';

// ships.last_position_at and ais_positions.time_utc are TIMESTAMP holding UTC, so window
// bounds are converted with AT TIME ZONE 'UTC' rather than relying on the session time zone.
const UTC_NOW = "(now() AT TIME ZONE 'UTC')";
const SHIP_POINT = 'ST_SetSRID(ST_MakePoint(sh.lon, sh.lat), 4326)::geography';

export const DashboardModel = {
  // Alert counts per bin, severity and type inside [start, end).
  async alertBins(start, end, stepSec) {
    return query(
      `SELECT floor(extract(epoch FROM a.created_at - ?::timestamptz) / ?)::int AS bin,
              a.severity, a.type, COUNT(*)::int AS n
       FROM alerts a
       WHERE a.created_at >= ? AND a.created_at < ?
       GROUP BY 1, 2, 3`,
      [start, stepSec, start, end]
    );
  },

  async anomalyBins(start, end, stepSec) {
    return query(
      `SELECT floor(extract(epoch FROM detected_at - ?::timestamptz) / ?)::int AS bin, COUNT(*)::int AS n
       FROM anomalies
       WHERE detected_at >= ? AND detected_at < ?
       GROUP BY 1`,
      [start, stepSec, start, end]
    );
  },

  // Distinct vessels reporting per bin, from the position history (7-day retention).
  async vesselBins(start, end, stepSec) {
    return query(
      `SELECT floor(extract(epoch FROM time_utc - (?::timestamptz AT TIME ZONE 'UTC')) / ?)::int AS bin,
              COUNT(DISTINCT mmsi)::int AS n
       FROM ais_positions
       WHERE time_utc >= (?::timestamptz AT TIME ZONE 'UTC') AND time_utc < (?::timestamptz AT TIME ZONE 'UTC')
       GROUP BY 1`,
      [start, stepSec, start, end]
    );
  },

  // Totals for the window before the current one, for "vs previous" comparisons.
  async previousTotals(start, end) {
    const [alerts] = await query(
      `SELECT COUNT(*) FILTER (WHERE severity IN ('high', 'critical'))::int AS high,
              COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical,
              COUNT(*) FILTER (WHERE type = 'geofence')::int AS incursions
       FROM alerts
       WHERE created_at >= ? AND created_at < ?`,
      [start, end]
    );
    const [anomalies] = await query(
      'SELECT COUNT(*)::int AS n FROM anomalies WHERE detected_at >= ? AND detected_at < ?',
      [start, end]
    );
    return { ...alerts, anomalies: anomalies.n };
  },

  async openAlerts() {
    const [row] = await query(
      `SELECT COUNT(*)::int AS open,
              COUNT(*) FILTER (WHERE assigned_to IS NULL)::int AS unassigned
       FROM alerts
       WHERE status = 'open'`
    );
    return row;
  },

  async topZone(start, end) {
    const [row] = await query(
      `SELECT r.name, COUNT(*)::int AS n
       FROM alerts a
       JOIN restricted_areas r ON r.id = a.restricted_area_id
       WHERE a.type = 'geofence' AND a.created_at >= ? AND a.created_at < ?
       GROUP BY r.name
       ORDER BY n DESC
       LIMIT 1`,
      [start, end]
    );
    return row?.name ?? null;
  },

  async topFlagged(start, end, limit = 5) {
    return query(
      `SELECT COALESCE(a.mmsi::text, v.mmsi) AS mmsi,
              COALESCE(v.name, s.ship_name, 'Unknown vessel') AS vessel_name,
              COUNT(*)::int AS count
       FROM alerts a
       LEFT JOIN vessels v ON v.vessel_id = a.vessel_id
       LEFT JOIN ships s ON s.mmsi = a.mmsi
       WHERE a.created_at >= ? AND a.created_at < ?
       GROUP BY 1, 2
       ORDER BY count DESC
       LIMIT ?`,
      [start, end, limit]
    );
  },

  async activeVessels(hours) {
    const [row] = await query(
      `SELECT COUNT(*)::int AS n FROM ships WHERE last_position_at > ${UTC_NOW} - make_interval(hours => ?)`,
      [hours]
    );
    return row.n;
  },

  // Vessels seen in the last `hours` per sector, busiest first.
  async sectorCounts(hours) {
    return query(
      `SELECT sc.id, sc.name, COUNT(sh.mmsi)::int AS vessels
       FROM sectors sc
       LEFT JOIN ships sh
         ON sh.last_position_at > ${UTC_NOW} - make_interval(hours => ?)
        AND sh.lat IS NOT NULL AND sh.lon IS NOT NULL
        AND ST_Intersects(sc.geom, ${SHIP_POINT})
       GROUP BY sc.id, sc.name
       ORDER BY vessels DESC, sc.id`,
      [hours]
    );
  },

  async sectorBounds(sectorId) {
    const [row] = await query(
      `SELECT ST_XMin(g) AS w, ST_YMin(g) AS s, ST_XMax(g) AS e, ST_YMax(g) AS n
       FROM (SELECT geom::geometry AS g FROM sectors WHERE id = ?) x`,
      [sectorId]
    );
    return row || null;
  },

  // Vessel counts on a cols x rows grid over the sector's bounding box (row 0 = north).
  async densityCells(sectorId, hours, cols, rows) {
    return query(
      `SELECT width_bucket(sh.lon, ST_XMin(sc.geom::geometry), ST_XMax(sc.geom::geometry), ?) - 1 AS col,
              width_bucket(sh.lat, ST_YMax(sc.geom::geometry), ST_YMin(sc.geom::geometry), ?) - 1 AS row,
              COUNT(*)::int AS n
       FROM sectors sc
       JOIN ships sh
         ON sh.last_position_at > ${UTC_NOW} - make_interval(hours => ?)
        AND sh.lat IS NOT NULL AND sh.lon IS NOT NULL
        AND ST_Intersects(sc.geom, ${SHIP_POINT})
       WHERE sc.id = ?
       GROUP BY 1, 2`,
      [cols, rows, hours, sectorId]
    );
  }
};
