import { query } from '../../config/db.config.js';

const THRESHOLD_COLUMNS = `t.type_group, t.label, t.p99_computed, t.sample_count, t.computed_at, t.p99_override,
       COALESCE(t.p99_override, t.p99_computed) AS p99_effective, t.updated_at,
       NULLIF(concat_ws(' ', u.first_name, u.last_name), '') AS updated_by_name`;

export const DetectionSettingsModel = {
  async listSettings() {
    return query(
      `SELECT s.key, s.value, s.updated_at,
              NULLIF(concat_ws(' ', u.first_name, u.last_name), '') AS updated_by_name
       FROM detection_settings s
       LEFT JOIN users u ON u.user_id = s.updated_by`
    );
  },

  async setSetting(key, value, userId) {
    await query(
      `INSERT INTO detection_settings (key, value, updated_by, updated_at)
       VALUES (?, ?::jsonb, ?, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [key, JSON.stringify(value), userId]
    );
  },

  async listThresholds() {
    return query(
      `SELECT ${THRESHOLD_COLUMNS}
       FROM speed_thresholds t
       LEFT JOIN users u ON u.user_id = t.updated_by
       ORDER BY t.type_group`
    );
  },

  async getThreshold(type_group) {
    const [row] = await query(
      `SELECT ${THRESHOLD_COLUMNS}
       FROM speed_thresholds t
       LEFT JOIN users u ON u.user_id = t.updated_by
       WHERE t.type_group = ?`,
      [type_group]
    );
    return row || null;
  },

  async setOverride(type_group, p99_override, userId) {
    await query(
      `UPDATE speed_thresholds
       SET p99_override = ?, updated_by = ?, updated_at = NOW()
       WHERE type_group = ?`,
      [p99_override, userId, type_group]
    );
    return this.getThreshold(type_group);
  },

  // Called by analytic-service after each refit; never touches an admin's override.
  async reportComputed(rows) {
    for (const r of rows) {
      await query(
        `INSERT INTO speed_thresholds (type_group, label, p99_computed, sample_count, computed_at)
         VALUES (?, ?, ?, ?, NOW())
         ON CONFLICT (type_group) DO UPDATE
         SET p99_computed = EXCLUDED.p99_computed,
             sample_count = EXCLUDED.sample_count,
             computed_at = NOW()`,
        [r.type_group, r.label || `AIS type ${r.type_group}`, r.p99, r.sample_count]
      );
    }
  },

  // Latest admin changes for the settings page's audit panel (REQ-F-083).
  async recentChanges(limit = 20) {
    return query(
      `SELECT a.activity_id, a.created_at, a.method, a.path, a.status_code, a.details,
              NULLIF(concat_ws(' ', u.first_name, u.last_name), '') AS user_name
       FROM activities a
       JOIN permissions p ON p.permission_id = a.permission_id
       LEFT JOIN users u ON u.user_id = a.user_id
       WHERE p.name = 'detection.manage' AND a.status_code < 400
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );
  }
};
