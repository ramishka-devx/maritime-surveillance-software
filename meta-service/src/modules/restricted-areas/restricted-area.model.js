import { query } from '../../config/db.config.js';

export const RestrictedAreaModel = {
  async create({ name, type, wktPolygon, status = 'active', expiresAt = null }) {
    const result = await query(
      `INSERT INTO restricted_areas (name, type, geom, status, expires_at)
       VALUES (?, ?, ST_GeogFromText(?), ?, ?)
       RETURNING id AS insert_id`,
      [name, type, wktPolygon, status, expiresAt]
    );

    return this.getById(result.insertId);
  },

  async update(id, { name, type, wktPolygon, status, expiresAt }) {
    await query(
      `UPDATE restricted_areas
       SET name = COALESCE(?, name), type = COALESCE(?, type),
           geom = COALESCE(ST_GeogFromText(?), geom), status = COALESCE(?, status),
           expires_at = CASE WHEN ? THEN ? ELSE expires_at END, updated_at = NOW()
       WHERE id = ?`,
      [name ?? null, type ?? null, wktPolygon ?? null, status ?? null, expiresAt !== undefined, expiresAt ?? null, id]
    );
    return this.getById(id);
  },

  async remove(id) {
    const rows = await query('DELETE FROM restricted_areas WHERE id = ? RETURNING id', [id]);
    return rows.length > 0;
  },

  async list({ type } = {}) {
    const where = [];
    const params = [];

    if (type) {
      where.push('type = ?');
      params.push(type);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    return query(
      `SELECT
         id,
         name,
         type,
         status,
         expires_at,
         ST_AsGeoJSON(geom::geometry) AS geometry,
         json_build_object(
           'lat', ST_Y(ST_Centroid(geom::geometry)),
           'lon', ST_X(ST_Centroid(geom::geometry))
         ) AS centroid,
         ST_Area(geom) AS area_sqm,
         ST_AsText(geom::geometry) AS wkt
       FROM restricted_areas
       ${whereClause}
       ORDER BY id DESC`,
      params
    );
  },

  async getById(id) {
    const rows = await query(
      `SELECT
         id,
         name,
         type,
         status,
         expires_at,
         ST_AsGeoJSON(geom::geometry) AS geometry,
         json_build_object(
           'lat', ST_Y(ST_Centroid(geom::geometry)),
           'lon', ST_X(ST_Centroid(geom::geometry))
         ) AS centroid,
         ST_Area(geom) AS area_sqm,
         ST_AsText(geom::geometry) AS wkt
       FROM restricted_areas
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0];
  },

  async detectEntries({ restricted_area_id, mmsi, limit = 200 } = {}) {
    const where = [];
    const params = [];

    if (restricted_area_id !== undefined) {
      where.push('r.id = ?');
      params.push(restricted_area_id);
    }

    if (mmsi) {
      where.push('s.mmsi = ?');
      params.push(mmsi);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    return query(
      `SELECT
         COALESCE(s.ship_name, sh.ship_name) AS ship_name,
         s.mmsi,
         r.id AS restricted_area_id,
         r.name AS restricted_zone,
         r.type AS restricted_area_type,
         s.time_utc,
         s.sog,
         s.cog,
         ST_Y(s.position::geometry) AS lat,
         ST_X(s.position::geometry) AS lon
       FROM ais_positions s
       JOIN restricted_areas r
         ON r.status = 'active'
        AND (r.expires_at IS NULL OR r.expires_at > s.time_utc)
        AND ST_Intersects(s.position, r.geom)
       LEFT JOIN ships sh
         ON sh.mmsi = s.mmsi
       ${whereClause}
       ORDER BY s.time_utc DESC
       LIMIT ?`,
      [...params, limit]
    );
  },

  async detectBreaches({ sinceTime, limit = 100 } = {}) {
    const where = [];
    const params = [];

    if (sinceTime) {
      where.push('s.time_utc >= ?');
      params.push(sinceTime);
    } else {
      where.push("s.time_utc >= NOW() - INTERVAL '15 minutes'");
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    return query(
      `SELECT
         s.id AS position_id,
         s.mmsi,
         COALESCE(s.ship_name, sh.ship_name) AS ship_name,
         r.id AS restricted_area_id,
         r.name AS restricted_zone,
         r.type AS restricted_area_type,
         s.time_utc,
         s.sog,
         s.cog,
         ST_Y(s.position::geometry) AS lat,
         ST_X(s.position::geometry) AS lon
       FROM ais_positions s
       JOIN restricted_areas r
         ON r.status = 'active'
        AND (r.expires_at IS NULL OR r.expires_at > s.time_utc)
        AND ST_Intersects(s.position, r.geom)
       LEFT JOIN ships sh
         ON sh.mmsi = s.mmsi
       ${whereClause}
       ORDER BY s.time_utc DESC
       LIMIT ?`,
      [...params, limit]
    );
  }
};
