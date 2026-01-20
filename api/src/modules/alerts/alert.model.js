import { query } from '../../config/db.config.js';

export const AlertModel = {
  async create(payload) {
    const {
      vessel_id,
      type = 'manual',
      severity = 'medium',
      status = 'open',
      title,
      description,
      created_by,
      assigned_to
    } = payload;

    const result = await query(
      `INSERT INTO alerts (
        vessel_id, type, severity, status, title, description, created_by, assigned_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vessel_id ?? null,
        type,
        severity,
        status,
        title,
        description ?? null,
        created_by,
        assigned_to ?? null
      ]
    );

    return this.getById(result.insertId);
  },

  async list({ page = 1, limit = 10, status, severity, vessel_id } = {}) {
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (status) {
      where.push('a.status = ?');
      params.push(status);
    }

    if (severity) {
      where.push('a.severity = ?');
      params.push(severity);
    }

    if (vessel_id !== undefined) {
      where.push('a.vessel_id = ?');
      params.push(vessel_id);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT
        a.alert_id, a.vessel_id, a.type, a.severity, a.status, a.title, a.description,
        a.created_by, a.assigned_to, a.created_at, a.updated_at, a.resolved_at,
        v.mmsi, v.name as vessel_name
      FROM alerts a
      LEFT JOIN vessels v ON v.vessel_id = a.vessel_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [{ count }] = await query(
      `SELECT COUNT(*) as count FROM alerts a ${whereClause}`,
      params
    );

    return { rows, total: count };
  },

  async getById(alert_id) {
    const rows = await query(
      `SELECT
        a.alert_id, a.vessel_id, a.type, a.severity, a.status, a.title, a.description,
        a.created_by, a.assigned_to, a.created_at, a.updated_at, a.resolved_at,
        v.mmsi, v.name as vessel_name
      FROM alerts a
      LEFT JOIN vessels v ON v.vessel_id = a.vessel_id
      WHERE a.alert_id = ?
      LIMIT 1`,
      [alert_id]
    );
    return rows[0];
  },

  async update(alert_id, payload) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      fields.push(`${key} = ?`);
      params.push(value);
    }

    if (fields.length === 0) return this.getById(alert_id);

    params.push(alert_id);
    await query(`UPDATE alerts SET ${fields.join(', ')}, updated_at = NOW() WHERE alert_id = ?`, params);
    return this.getById(alert_id);
  },

  async updateStatus(alert_id, status) {
    const resolvedAt = status === 'resolved' ? 'NOW()' : 'NULL';
    await query(
      `UPDATE alerts
       SET status = ?, resolved_at = ${resolvedAt}, updated_at = NOW()
       WHERE alert_id = ?`,
      [status, alert_id]
    );
    return this.getById(alert_id);
  },

  async assign(alert_id, assigned_to) {
    await query(
      `UPDATE alerts
       SET assigned_to = ?, updated_at = NOW()
       WHERE alert_id = ?`,
      [assigned_to, alert_id]
    );
    return this.getById(alert_id);
  }
};
