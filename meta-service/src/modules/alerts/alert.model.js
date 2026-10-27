import { query } from '../../config/db.config.js';

// mmsi/vessel_name prefer the alert's own AIS link (ships), falling back to the vessels registry.
const ALERT_COLUMNS = `a.alert_id, a.vessel_id, a.type, a.severity, a.status, a.title, a.description,
        a.created_by, a.assigned_to, a.created_at, a.updated_at, a.resolved_at, a.restricted_area_id,
        a.lat, a.lon, NULLIF(concat_ws(' ', u.first_name, u.last_name), '') AS assignee_name,
        COALESCE(a.mmsi::text, v.mmsi) AS mmsi, COALESCE(v.name, s.ship_name) AS vessel_name`;
const ALERT_FROM = `alerts a
      LEFT JOIN vessels v ON v.vessel_id = a.vessel_id
      LEFT JOIN ships s ON s.mmsi = a.mmsi
      LEFT JOIN users u ON u.user_id = a.assigned_to`;
const SEVERITY_ORDER = `CASE a.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`;

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
      assigned_to,
      mmsi,
      restricted_area_id,
      lat,
      lon
    } = payload;

    const result = await query(
      `INSERT INTO alerts (
        vessel_id, type, severity, status, title, description, created_by, assigned_to,
        mmsi, restricted_area_id, lat, lon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vessel_id ?? null,
        type,
        severity,
        status,
        title,
        description ?? null,
        created_by,
        assigned_to ?? null,
        mmsi ?? null,
        restricted_area_id ?? null,
        lat ?? null,
        lon ?? null
      ]
    );

    return this.getById(result.insertId);
  },

  async list({ page = 1, limit = 10, status, severity, vessel_id, type, mmsi, from, to, sort } = {}) {
    const pageNum = Number.isFinite(Number(page)) ? Number(page) : 1;
    const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 10;
    const safePage = pageNum > 0 ? Math.floor(pageNum) : 1;
    const safeLimit = limitNum > 0 ? Math.floor(limitNum) : 10;
    const offset = (safePage - 1) * safeLimit;

    const where = [];
    const params = [];

    // status: one value or a comma-separated list ("open,acknowledged"), validated upstream.
    if (status) {
      const statuses = String(status).split(',');
      where.push(`a.status IN (${statuses.map(() => '?').join(', ')})`);
      params.push(...statuses);
    }

    if (severity) {
      where.push('a.severity = ?');
      params.push(severity);
    }

    if (vessel_id !== undefined) {
      where.push('a.vessel_id = ?');
      params.push(vessel_id);
    }

    if (type) {
      where.push('a.type = ?');
      params.push(type);
    }

    if (mmsi) {
      where.push('a.mmsi = ?');
      params.push(mmsi);
    }

    if (from) {
      where.push('a.created_at >= ?');
      params.push(from);
    }

    if (to) {
      where.push('a.created_at <= ?');
      params.push(to);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT ${ALERT_COLUMNS}
      FROM ${ALERT_FROM}
      ${whereClause}
      ORDER BY ${sort === 'severity' ? `${SEVERITY_ORDER}, ` : ''}a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [{ count }] = await query(
      `SELECT COUNT(*) as count FROM alerts a ${whereClause}`,
      params
    );

    return { rows, total: count };
  },

  async getById(alert_id) {
    const rows = await query(
      `SELECT ${ALERT_COLUMNS}
      FROM ${ALERT_FROM}
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
