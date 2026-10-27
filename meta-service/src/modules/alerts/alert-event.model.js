import { query } from '../../config/db.config.js';

// Timeline of an alert. Detector events are full sentences (actor_id null); operator events
// are phrases ("marked it acknowledged") shown after the actor's name.
export const AlertEventModel = {
  async add({ alert_id, kind, text, actor_id = null, data = null, at = null }) {
    await query(
      `INSERT INTO alert_events (alert_id, at, kind, text, actor_id, data)
       VALUES (?, COALESCE(?::timestamptz, NOW()), ?, ?, ?, ?)`,
      [alert_id, at, kind, text, actor_id, data ? JSON.stringify(data) : null]
    );
  },

  async listFor(alert_id) {
    return query(
      `SELECT e.id, e.at, e.kind, e.text, e.data, e.actor_id,
              NULLIF(concat_ws(' ', u.first_name, u.last_name), '') AS actor_name
       FROM alert_events e
       LEFT JOIN users u ON u.user_id = e.actor_id
       WHERE e.alert_id = ?
       ORDER BY e.at, e.id`,
      [alert_id]
    );
  }
};
