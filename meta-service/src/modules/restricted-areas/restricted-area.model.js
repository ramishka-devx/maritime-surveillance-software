import { query } from '../../config/db.config.js';

export const RestrictedAreaModel = {
  async create({ name, type, wktPolygon }) {
    const result = await query(
      `INSERT INTO restricted_areas (name, type, geom)
       VALUES ($1, $2, ST_GeomFromText($3, 4326))
       RETURNING id AS insert_id`,
      [name, type, wktPolygon]
    );

    return this.getById(result.insertId);
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
         ST_AsGeoJSON(geom::geometry) AS geometry,
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
         ST_AsGeoJSON(geom::geometry) AS geometry,
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
         sh.ship_name,
         s.mmsi,
         r.id AS restricted_area_id,
         r.name AS restricted_zone,
         r.type AS restricted_area_type,
         s.time_utc,
         ST_Y(s.position::geometry) AS lat,
         ST_X(s.position::geometry) AS lon
       FROM ais_positions s
       LEFT JOIN ships sh ON sh.mmsi = s.mmsi
       JOIN restricted_areas r
         ON ST_Intersects(s.position, r.geom)
       ${whereClause}
       ORDER BY s.time_utc DESC
       LIMIT ?`,
      [...params, limit]
    );
  }
};
