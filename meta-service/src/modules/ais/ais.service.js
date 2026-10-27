import { query } from '../../config/db.config.js';
import { badRequest } from '../../utils/errorHandler.js';

function normalizeLimit(limit, { min = 1, max = 1000, fallback = 200 } = {}) {
  if (limit === undefined || limit === null || limit === '') return fallback;
  const n = Number(limit);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw badRequest('limit must be an integer');
  if (n < min || n > max) throw badRequest(`limit must be between ${min} and ${max}`);
  return n;
}

function normalizeMmsi(mmsi) {
  const s = String(mmsi || '').trim();
  if (!/^[0-9]{6,9}$/.test(s)) throw badRequest('Invalid MMSI');
  return s;
}

const clampLat = (lat) => Math.min(90, Math.max(-90, lat));
const wrapLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;

// bbox=minLon,minLat,maxLon,maxLat (the map's padded viewport) -> SQL condition on
// ships.lat/lon, or null for no filter. Latitudes are clamped (padded world bounds overshoot
// ±90); a span of >= 360° of longitude means "whole world"; boxes crossing the antimeridian
// (minLon > maxLon after wrapping) match either side.
function bboxCondition(bbox) {
  if (bbox === undefined || bbox === null || bbox === '') return null;
  const parts = String(bbox).split(',').map(Number);
  if (parts.length !== 4 || !parts.every(Number.isFinite)) {
    throw badRequest('bbox must be minLon,minLat,maxLon,maxLat');
  }
  const [minLon, minLat, maxLon, maxLat] = parts;
  if (minLat > maxLat) throw badRequest('bbox minLat must be <= maxLat');

  const conditions = ['lat BETWEEN ? AND ?'];
  const params = [clampLat(minLat), clampLat(maxLat)];
  if (maxLon - minLon < 360) {
    const west = wrapLon(minLon);
    const east = wrapLon(maxLon);
    conditions.push(west <= east ? 'lon BETWEEN ? AND ?' : '(lon >= ? OR lon <= ?)');
    params.push(west, east);
  }
  return { sql: conditions.join(' AND '), params };
}

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// Latest position per vessel, denormalised onto ships by ingest-service, so these read one
// row per vessel instead of scanning the ais_positions history.
// ponytail: seq scan on ships (~16k rows, a few ms); add a (lat, lon) index past ~200k ships.
const LATEST_COLUMNS = `mmsi, ship_name, sog, cog, heading, nav_status,
       last_position_at AS time_utc, lat, lon, ship_type, st.description AS ship_type_name`;
// ship_types is the AIS code lookup (PK join), so the map can colour vessels by type.
const LATEST_FROM = 'ships LEFT JOIN ship_types st ON st.ship_type_id = ships.ship_type';

export const AisService = {
  // Positions stored per second over the last minute (idx_ais_positions_time). time_utc is
  // the transponder's timestamp, so this approximates the ingest rate.
  async rate() {
    const [row] = await query(
      `SELECT COUNT(*)::int AS n FROM ais_positions
       WHERE time_utc > (now() AT TIME ZONE 'UTC') - interval '60 seconds'`
    );
    return { positions_per_s: Math.round((row.n / 60) * 10) / 10 };
  },

  // Most recently seen vessels, optionally searched by name (substring) or MMSI (prefix).
  async listVessels({ limit, q } = {}) {
    const search = String(q ?? '').trim();
    const safeLimit = normalizeLimit(limit, { fallback: search ? 10 : 500, max: 5000 });

    const where = ['last_position_at IS NOT NULL'];
    const params = [];
    if (search) {
      where.push('(ship_name ILIKE ? OR mmsi::text LIKE ?)');
      params.push(`%${escapeLike(search)}%`, `${escapeLike(search)}%`);
    }

    return query(
      `SELECT ${LATEST_COLUMNS}
       FROM ${LATEST_FROM}
       WHERE ${where.join(' AND ')}
       ORDER BY last_position_at DESC
       LIMIT ?`,
      [...params, safeLimit],
    );
  },

  async latestPositions({ limit, bbox } = {}) {
    const safeLimit = normalizeLimit(limit, { fallback: 500, max: 5000 });
    const box = bboxCondition(bbox);

    return query(
      `SELECT ${LATEST_COLUMNS}
       FROM ${LATEST_FROM}
       WHERE last_position_at IS NOT NULL${box ? ` AND ${box.sql}` : ''}
       ORDER BY last_position_at DESC
       LIMIT ?`,
      [...(box ? box.params : []), safeLimit],
    );
  },

  async positionsByMmsi(mmsi, { limit } = {}) {
    const safeMmsi = normalizeMmsi(mmsi);
    const safeLimit = normalizeLimit(limit, { fallback: 200, max: 5000 });

    const rows = await query(
      `SELECT
         a.mmsi,
         s.ship_name,
         a.sog,
         a.cog,
         a.heading,
         a.nav_status,
         a.time_utc,
         ST_Y(a.position::geometry) AS lat,
         ST_X(a.position::geometry) AS lon
       FROM ais_positions a
       LEFT JOIN ships s ON a.mmsi = s.mmsi
       WHERE a.mmsi = ?
       ORDER BY a.time_utc DESC
       LIMIT ?`,
      [safeMmsi, safeLimit],
    );

    return rows;
  },
};
