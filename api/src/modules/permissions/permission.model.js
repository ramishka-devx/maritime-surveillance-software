import { query } from '../../config/db.config.js';

export const PermissionModel = {
  async create({ name, description }) {
    const result = await query('INSERT INTO permissions (name, description) VALUES (?, ?)', [name, description]);
    return { permission_id: result.insertId, name, description };
  },
  async list() {
    return query('SELECT * FROM permissions ORDER BY name');
  },
  async remove(permission_id) {
    await query('DELETE FROM permissions WHERE permission_id = ?', [permission_id]);
  },
  async assign(role_id, permission_id) {
    await query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [role_id, permission_id]);
  },
  async revoke(role_id, permission_id) {
    await query('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [role_id, permission_id]);
  }
};
