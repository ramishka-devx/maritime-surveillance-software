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

    // Most recently seen vessels; ships.last_position_at is kept current by ingest-service.
    const rows = await query(
      `SELECT mmsi, ship_name, last_position_at AS time_utc
       FROM ships
       WHERE last_position_at IS NOT NULL
       ORDER BY last_position_at DESC
       LIMIT ?`,
      [safeLimit],
    );

    return rows;
  },

  async latestPositions({ limit } = {}) {
    const safeLimit = normalizeLimit(limit, { fallback: 500, max: 5000 });

    // Latest position per vessel, denormalised onto ships by ingest-service so this reads
    // one row per vessel instead of scanning the whole ais_positions history.
    const rows = await query(
      `SELECT mmsi, ship_name, sog, cog, heading, nav_status,
              last_position_at AS time_utc, lat, lon
       FROM ships
       WHERE last_position_at IS NOT NULL
       ORDER BY last_position_at DESC
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
