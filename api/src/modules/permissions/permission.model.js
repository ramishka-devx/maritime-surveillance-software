import { query } from '../../config/db.config.js';

export const PermissionModel = {
  async create({ name, module = null, description = null }) {
    const result = await query(
      'INSERT INTO permissions (name, module, description, is_active) VALUES (?, ?, ?, 1)', 
      [name, module, description]
    );
    return { permission_id: result.insertId, name, module, description, is_active: 1 };
  },

  async findById(permission_id) {
    const sql = `
      SELECT permission_id, name, module, description, is_active, created_at
      FROM permissions 
      WHERE permission_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [permission_id]);
    return rows[0];
  },

  async findByName(name) {
    const sql = `
      SELECT permission_id, name, module, description, is_active, created_at
      FROM permissions 
      WHERE name = ?
      LIMIT 1
    `;
    const rows = await query(sql, [name]);
    return rows[0];
  },

  async list({ page = 1, limit = 50, module = null, activeOnly = true } = {}) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT permission_id, name, module, description, is_active, created_at
      FROM permissions
      WHERE 1=1
    `;
    const params = [];
    
    if (activeOnly) {
      sql += ' AND is_active = 1';
    }
    
    if (module) {
      sql += ' AND module = ?';
      params.push(module);
    }
    
    sql += ' ORDER BY module, name LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    
    const rows = await query(sql, params);
    
    let countSql = 'SELECT COUNT(*) as count FROM permissions WHERE 1=1';
    const countParams = [];
    if (activeOnly) countSql += ' AND is_active = 1';
    if (module) {
      countSql += ' AND module = ?';
      countParams.push(module);
    }
    
    const [{ count }] = await query(countSql, countParams);
    return { rows, total: count };
  },

  async listAll() {
    return query(`
      SELECT permission_id, name, module, description, is_active, created_at
      FROM permissions 
      WHERE is_active = 1
      ORDER BY module, name
    `);
  },

  async listByModule() {
    const sql = `
      SELECT permission_id, name, module, description
      FROM permissions
      WHERE is_active = 1
      ORDER BY module, name
    `;
    const rows = await query(sql);
    
    // Group by module
    const grouped = {};
    for (const row of rows) {
      const mod = row.module || 'other';
      if (!grouped[mod]) {
        grouped[mod] = [];
      }
      grouped[mod].push(row);
    }
    return grouped;
  },

  async getModules() {
    const sql = `
      SELECT DISTINCT module, COUNT(*) as permission_count
      FROM permissions
      WHERE is_active = 1 AND module IS NOT NULL
      GROUP BY module
      ORDER BY module
    `;
    return query(sql);
  },

  async update(permission_id, data) {
    const { name, module, description } = data;
    const fields = [];
    const params = [];
    
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (module !== undefined) {
      fields.push('module = ?');
      params.push(module);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    
    if (fields.length === 0) return this.findById(permission_id);
    
    params.push(permission_id);
    await query(`UPDATE permissions SET ${fields.join(', ')} WHERE permission_id = ?`, params);
    return this.findById(permission_id);
  },

  async remove(permission_id) {
    // Soft delete by setting is_active = 0
    await query('UPDATE permissions SET is_active = 0 WHERE permission_id = ?', [permission_id]);
  },

  async hardDelete(permission_id) {
    await query('DELETE FROM permissions WHERE permission_id = ?', [permission_id]);
  },

  async checkNameExists(name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM permissions WHERE name = ?';
    const params = [name];
    
    if (excludeId) {
      sql += ' AND permission_id != ?';
      params.push(excludeId);
    }
    
    const [{ count }] = await query(sql, params);
    return count > 0;
  },

  // Role-Permission Management (kept for backward compatibility)
  async assign(role_id, permission_id) {
    await query(
      'INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at) VALUES (?, ?, NOW())', 
      [role_id, permission_id]
    );
  },

  async revoke(role_id, permission_id) {
    await query(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', 
      [role_id, permission_id]
    );
  },

  // Get roles that have a specific permission
  async getRolesWithPermission(permission_id) {
    const sql = `
      SELECT r.role_id, r.name, r.description, rp.granted_at
      FROM roles r
      JOIN role_permissions rp ON rp.role_id = r.role_id
      WHERE rp.permission_id = ? AND r.is_active = 1
      ORDER BY r.name
    `;
    return query(sql, [permission_id]);
  }
};
