import { query } from '../../config/db.config.js';

export const PositionModel = {
  async create(vessel_id, payload) {
    const {
      recorded_at,
      lat,
      lon,
      sog_kn,
      cog_deg,
      heading_deg,
      nav_status,
      source = 'ais'
    } = payload;

    const result = await query(
      `INSERT INTO vessel_positions (
        vessel_id, recorded_at, lat, lon, sog_kn, cog_deg, heading_deg, nav_status, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vessel_id,
        recorded_at,
        lat,
        lon,
        sog_kn ?? null,
        cog_deg ?? null,
        heading_deg ?? null,
        nav_status || null,
        source
      ]
    );

    return this.getById(result.insertId);
  },

  async listByVessel(vessel_id, { page = 1, limit = 25, from, to } = {}) {
    const offset = (page - 1) * limit;

    const where = ['vessel_id = ?'];
    const params = [vessel_id];

    if (from) {
      where.push('recorded_at >= ?');
      params.push(from);
    }

    if (to) {
      where.push('recorded_at <= ?');
      params.push(to);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const rows = await query(
      `SELECT position_id, vessel_id, recorded_at, lat, lon, sog_kn, cog_deg, heading_deg, nav_status, source, created_at
       FROM vessel_positions
       ${whereClause}
       ORDER BY recorded_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [{ count }] = await query(
      `SELECT COUNT(*) as count FROM vessel_positions ${whereClause}`,
      params
    );

    return { rows, total: count };
  },

  async getById(position_id) {
    const rows = await query(
      `SELECT position_id, vessel_id, recorded_at, lat, lon, sog_kn, cog_deg, heading_deg, nav_status, source, created_at
       FROM vessel_positions
       WHERE position_id = ?
       LIMIT 1`,
      [position_id]
    );
    return rows[0];
  },

  async latestByVessel(vessel_id) {
    const rows = await query(
      `SELECT position_id, vessel_id, recorded_at, lat, lon, sog_kn, cog_deg, heading_deg, nav_status, source, created_at
       FROM vessel_positions
       WHERE vessel_id = ?
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [vessel_id]
    );
    return rows[0];
  }
};
