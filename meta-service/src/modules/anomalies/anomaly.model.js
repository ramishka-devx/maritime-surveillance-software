import { query } from '../../config/db.config.js';

export const AnomalyModel = {
  async create(payload) {
    const {
      mmsi,
      anomaly_type,
      sog,
      cog,
      heading,
      nav_status,
      p99_speed,
      details,
      lon,
      alt,
      detected_at
    } = payload;

    const result = await query(
      `INSERT INTO anomalies (
        mmsi, anomaly_type, sog, cog, heading, nav_status, p99_speed, details, lon, alt, detected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))`,
      [
        mmsi,
        anomaly_type,
        sog ?? null,
        cog ?? null,
        heading ?? null,
        nav_status ?? null,
        p99_speed ?? null,
        details ?? null,
        lon ?? null,
        alt ?? null,
        detected_at ?? null
      ]
    );

    return this.getById(result.insertId);
  },

  async list({
    page = 1,
    limit = 25,
    mmsi,
    from,
    to,
    anomaly_type
  } = {}) {
    const pageNum = Number.isFinite(Number(page)) ? Number(page) : 1;
    const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 25;
    const safePage = pageNum > 0 ? Math.floor(pageNum) : 1;
    const safeLimit = limitNum > 0 ? Math.floor(limitNum) : 25;
    const offset = (safePage - 1) * safeLimit;

    const where = [];
    const params = [];

    if (mmsi !== undefined) {
      where.push('a.mmsi = ?');
      params.push(mmsi);
    }

    if (anomaly_type !== undefined) {
      where.push('a.anomaly_type = ?');
      params.push(anomaly_type);
    }

    if (from) {
      where.push('a.detected_at >= ?');
      params.push(from);
    }

    if (to) {
      where.push('a.detected_at <= ?');
      params.push(to);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT
        a.anomaly_id, a.mmsi, a.anomaly_type, a.sog, a.cog, a.heading,
        a.nav_status, a.p99_speed, a.details, a.lon, a.alt, a.detected_at
      FROM anomalies a
      ${whereClause}
      ORDER BY a.detected_at DESC
      LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [{ count }] = await query(
      `SELECT COUNT(*) as count FROM anomalies a ${whereClause}`,
      params
    );

    return { rows, total: count };
  },

  async getById(anomaly_id) {
    const rows = await query(
      `SELECT
        a.anomaly_id, a.mmsi, a.anomaly_type, a.sog, a.cog, a.heading,
        a.nav_status, a.p99_speed, a.details, a.lon, a.alt, a.detected_at
      FROM anomalies a
      WHERE a.anomaly_id = ?
      LIMIT 1`,
      [anomaly_id]
    );
    return rows[0];
  },

  async update(anomaly_id, payload) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      fields.push(`${key} = ?`);
      params.push(value);
    }

    if (fields.length === 0) return this.getById(anomaly_id);

    params.push(anomaly_id);
    await query(`UPDATE anomalies SET ${fields.join(', ')} WHERE anomaly_id = ?`, params);
    return this.getById(anomaly_id);
  },

  async remove(anomaly_id) {
    const result = await query('DELETE FROM anomalies WHERE anomaly_id = ?', [anomaly_id]);
    return result.affectedRows > 0;
  }
};
