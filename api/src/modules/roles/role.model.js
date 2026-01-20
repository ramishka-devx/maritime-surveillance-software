import { query } from '../../config/db.config.js';

export const RoleModel = {
  async list({ page = 1, limit = 10, includePermissionCount = false }) {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT 
        r.role_id, r.name, r.description, r.is_system, r.is_active,
        r.created_at, r.updated_at
    `;
    
    if (includePermissionCount) {
      sql += `,
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.role_id) as permission_count
      `;
    }
    
    sql += `
      FROM roles r
      ORDER BY r.is_system DESC, r.name
      LIMIT ? OFFSET ?
    `;
    
    const rows = await query(sql, [Number(limit), Number(offset)]);
    const [{ count }] = await query('SELECT COUNT(*) as count FROM roles');
    return { rows, total: count };
  },

  async findById(role_id) {
    const sql = `
      SELECT role_id, name, description, is_system, is_active, created_at, updated_at
      FROM roles 
      WHERE role_id = ? 
      LIMIT 1
    `;
    const rows = await query(sql, [role_id]);
    return rows[0];
  },

  async findByName(name) {
    const sql = `
      SELECT role_id, name, description, is_system, is_active, created_at, updated_at
      FROM roles 
      WHERE name = ? 
      LIMIT 1
    `;
    const rows = await query(sql, [name]);
    return rows[0];
  },

  async getAll() {
    const sql = `
      SELECT role_id, name, description, is_system, is_active
      FROM roles 
      WHERE is_active = 1
      ORDER BY is_system DESC, name
    `;
    return query(sql);
  },

  async create(roleData) {
    const { name, description = null } = roleData;
    const result = await query(
      'INSERT INTO roles (name, description, is_system, is_active) VALUES (?, ?, 0, 1)',
      [name, description]
    );
    return { role_id: result.insertId, name, description, is_system: 0, is_active: 1 };
  },

  async update(role_id, roleData) {
    const { name, description } = roleData;
    const fields = [];
    const params = [];
    
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    
    if (fields.length === 0) return this.findById(role_id);
    
    params.push(role_id);
    await query(`UPDATE roles SET ${fields.join(', ')}, updated_at = NOW() WHERE role_id = ?`, params);
    return this.findById(role_id);
  },

  async delete(role_id) {
    const result = await query('DELETE FROM roles WHERE role_id = ? AND is_system = 0', [role_id]);
    return result.affectedRows > 0;
  },

  async setActive(role_id, is_active) {
    await query('UPDATE roles SET is_active = ?, updated_at = NOW() WHERE role_id = ?', [is_active ? 1 : 0, role_id]);
    return this.findById(role_id);
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
  },

  // ==========================================
  // Permission Management for Roles
  // ==========================================

  async getPermissions(role_id) {
    const sql = `
      SELECT p.permission_id, p.name, p.module, p.description,
             rp.granted_at, rp.granted_by
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.module, p.name
    `;
    return query(sql, [role_id]);
  },

  async getPermissionsWithAssignment(role_id) {
    const sql = `
      SELECT 
        p.permission_id, p.name, p.module, p.description,
        CASE WHEN rp.permission_id IS NULL THEN 0 ELSE 1 END AS assigned,
        rp.granted_at, rp.granted_by
      FROM permissions p
      LEFT JOIN role_permissions rp ON rp.permission_id = p.permission_id AND rp.role_id = ?
      WHERE p.is_active = 1
      ORDER BY p.module, p.name
    `;
    return query(sql, [role_id]);
  },

  async assignPermission(role_id, permission_id, granted_by = null) {
    await query(
      'INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by) VALUES (?, ?, NOW(), ?)',
      [role_id, permission_id, granted_by]
    );
  },

  async revokePermission(role_id, permission_id) {
    await query(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [role_id, permission_id]
    );
  },

  async assignMultiplePermissions(role_id, permission_ids, granted_by = null) {
    if (!permission_ids || permission_ids.length === 0) return;
    
    const values = permission_ids.map(pid => [role_id, pid, granted_by]);
    const placeholders = values.map(() => '(?, ?, NOW(), ?)').join(', ');
    const flatValues = values.flat();
    
    await query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by) VALUES ${placeholders}`,
      flatValues
    );
  },

  async revokeAllPermissions(role_id) {
    await query('DELETE FROM role_permissions WHERE role_id = ?', [role_id]);
  },

  async syncPermissions(role_id, permission_ids, granted_by = null) {
    // Remove all existing, then add new ones
    await this.revokeAllPermissions(role_id);
    await this.assignMultiplePermissions(role_id, permission_ids, granted_by);
  },

  // ==========================================
  // User-Role Management
  // ==========================================

  async getUsersWithRole(role_id, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.username, u.status,
             ur.assigned_at, ur.assigned_by
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.user_id
      WHERE ur.role_id = ?
      ORDER BY u.last_name, u.first_name
      LIMIT ? OFFSET ?
    `;
    const rows = await query(sql, [role_id, Number(limit), Number(offset)]);
    
    const [{ count }] = await query(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [role_id]
    );
    
    return { rows, total: count };
  },

  async getRoleStats() {
    const sql = `
      SELECT 
        r.role_id, r.name, r.description, r.is_system,
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.role_id) as permission_count,
        (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.role_id) as user_count
      FROM roles r
      WHERE r.is_active = 1
      ORDER BY r.is_system DESC, r.name
    `;
    return query(sql);
  }
};