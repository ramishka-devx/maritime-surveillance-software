import { query } from '../../config/db.config.js';

export const VesselModel = {
  async create(payload) {
    const {
      mmsi,
      imo,
      name,
      callsign,
      flag,
      vessel_type,
      length_m,
      width_m,
      status = 'active'
    } = payload;

    const result = await query(
      `INSERT INTO vessels (mmsi, imo, name, callsign, flag, vessel_type, length_m, width_m, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    , [mmsi, imo || null, name || null, callsign || null, flag || null, vessel_type || null, length_m ?? null, width_m ?? null, status]);

    return this.findById(result.insertId);
  },

  async list({ page = 1, limit = 10, q } = {}) {
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (q) {
      where.push('(mmsi LIKE ? OR name LIKE ? OR callsign LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT vessel_id, mmsi, imo, name, callsign, flag, vessel_type, length_m, width_m, status, created_at, updated_at
       FROM vessels
       ${whereClause}
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [{ count }] = await query(
      `SELECT COUNT(*) as count FROM vessels ${whereClause}`,
      params
    );

    return { rows, total: count };
  },

  async findById(vessel_id) {
    const rows = await query(
      `SELECT vessel_id, mmsi, imo, name, callsign, flag, vessel_type, length_m, width_m, status, created_at, updated_at
       FROM vessels
       WHERE vessel_id = ?
       LIMIT 1`,
      [vessel_id]
    );
    return rows[0];
  },

  async findByMmsi(mmsi) {
    const rows = await query(
      `SELECT vessel_id, mmsi, imo, name, callsign, flag, vessel_type, length_m, width_m, status, created_at, updated_at
       FROM vessels
       WHERE mmsi = ?
       LIMIT 1`,
      [mmsi]
    );
    return rows[0];
  },

  async update(vessel_id, payload) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      fields.push(`${key} = ?`);
      params.push(value);
    }

    if (fields.length === 0) return this.findById(vessel_id);

    params.push(vessel_id);
    await query(`UPDATE vessels SET ${fields.join(', ')}, updated_at = NOW() WHERE vessel_id = ?`, params);
    return this.findById(vessel_id);
  },

  async remove(vessel_id) {
    const result = await query('DELETE FROM vessels WHERE vessel_id = ?', [vessel_id]);
    return result.affectedRows > 0;
  }
};
