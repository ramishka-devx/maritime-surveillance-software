import { query } from '../../config/db.config.js';

export const RoleModel = {
  async list({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const rows = await query(`
      SELECT 
        role_id, name
      FROM roles
      ORDER BY name
      LIMIT ? OFFSET ?
    `, [Number(limit), Number(offset)]);
    const [{ count }] = await query('SELECT COUNT(*) as count FROM roles');
    return { rows, total: count };
  },

  async findById(role_id) {
    const rows = await query('SELECT role_id, name FROM roles WHERE role_id = ? LIMIT 1', [role_id]);
    return rows[0];
  },

  async findByName(name) {
    const rows = await query('SELECT role_id, name FROM roles WHERE name = ? LIMIT 1', [name]);
    return rows[0];
  },

  async getAll() {
    const rows = await query('SELECT role_id, name FROM roles ORDER BY name');
    return rows;
  },

  async create(roleData) {
    const { name } = roleData;
    const result = await query('INSERT INTO roles (name) VALUES (?)', [name]);
    return { role_id: result.insertId, name };
  },

  async update(role_id, roleData) {
    const { name } = roleData;
    await query('UPDATE roles SET name = ? WHERE role_id = ?', [name, role_id]);
    return { role_id, name };
  },

  async delete(role_id) {
    const result = await query('DELETE FROM roles WHERE role_id = ?', [role_id]);
    return result.affectedRows > 0;
  },

  async checkNameExists(name, excludeRoleId = null) {
    const params = [name];
    let sql = 'SELECT COUNT(*) as count FROM roles WHERE name = ?';
    
    if (excludeRoleId) {
      sql += ' AND role_id != ?';
      params.push(excludeRoleId);
    }
    
    const [{ count }] = await query(sql, params);
    return count > 0;
  }
};