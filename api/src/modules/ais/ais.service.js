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

export const AisService = {
  async listVessels({ limit } = {}) {
    const safeLimit = normalizeLimit(limit, { fallback: 500, max: 5000 });

    // Latest known ship_name per MMSI.
    const rows = await query(
      `SELECT DISTINCT ON (mmsi)
         mmsi,
         ship_name,
         time_utc
       FROM ais_positions
       ORDER BY mmsi, time_utc DESC
       LIMIT ?`,
      [safeLimit],
    );

    return rows;
  },

  async latestPositions({ limit } = {}) {
    const safeLimit = normalizeLimit(limit, { fallback: 500, max: 5000 });

    // Latest position per MMSI. Requires PostGIS (position geography).
    const rows = await query(
      `SELECT DISTINCT ON (mmsi)
         mmsi,
         ship_name,
         sog,
         cog,
         heading,
         nav_status,
         time_utc,
         ST_Y(position::geometry) AS lat,
         ST_X(position::geometry) AS lon
       FROM ais_positions
       ORDER BY mmsi, time_utc DESC
       LIMIT ?`,
      [safeLimit],
    );

    return rows;
  },

  async positionsByMmsi(mmsi, { limit } = {}) {
    const safeMmsi = normalizeMmsi(mmsi);
    const safeLimit = normalizeLimit(limit, { fallback: 200, max: 5000 });

    const rows = await query(
      `SELECT
         mmsi,
         ship_name,
         sog,
         cog,
         heading,
         nav_status,
         time_utc,
         ST_Y(position::geometry) AS lat,
         ST_X(position::geometry) AS lon
       FROM ais_positions
       WHERE mmsi = ?
       ORDER BY time_utc DESC
       LIMIT ?`,
      [safeMmsi, safeLimit],
    );

    return rows;
  },
};
