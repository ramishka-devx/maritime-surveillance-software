import { query } from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { badRequest } from '../../utils/errorHandler.js';

export const UserModel = {
  async create({ first_name, last_name, username, email, password_hash, role_id, status }) {
    const withStatus = status !== undefined && status !== null;
    const sql = withStatus
      ? `INSERT INTO users (first_name, last_name, username, email, password_hash, role_id, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`
      : `INSERT INTO users (first_name, last_name, username, email, password_hash, role_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const params = withStatus
      ? [first_name, last_name, username, email, password_hash, role_id, status]
      : [first_name, last_name, username, email, password_hash, role_id];

    const result = await query(sql, params);
    const user_id = result.insertId;
    
    // Also add to user_roles table for multi-role support
    await query(
      'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())',
      [user_id, role_id]
    );
    
    return { user_id, first_name, last_name, username, email, role_id };
  },
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0];
  },
  async findByUsername(username) {
    const rows = await query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    return rows[0];
  },
  async findByIdentifier(identifier) {
    const raw = String(identifier || '').trim();
    if (!raw) return null;
    if (raw.includes('@')) return this.findByEmail(raw);
    return this.findByUsername(raw);
  },
  async findById(user_id) {
    const rows = await query('SELECT u.user_id, u.first_name, u.last_name, u.username, u.email, u.role_id, u.status, r.name as role, u.profileImg, u.created_at, u.updated_at FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ? LIMIT 1', [user_id]);
    return rows[0];
  },
  async list({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const rows = await query(`
      SELECT 
        u.user_id, u.first_name, u.last_name, u.email, 
        u.role_id, r.name AS role, 
        u.status, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      LIMIT ? OFFSET ?
    `, [Number(limit), Number(offset)]);
    const [{ count }] = await query('SELECT COUNT(*) as count FROM users');
    return { rows, total: count };
  },
  async update(user_id, payload) {
    const fields = [];
    const params = [];
    for (const [k, v] of Object.entries(payload)) {
      if (v === undefined) continue;
      fields.push(`${k} = ?`);
      params.push(v);
    }
    if (fields.length === 0) return this.findById(user_id);
    params.push(user_id);
    await query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = ?`, params);
    return this.findById(user_id);
  },
  async remove(user_id) {
    await query('DELETE FROM users WHERE user_id = ?', [user_id]);
  },
  async updateStatus(user_id, status) {
    await query('UPDATE users SET status = ?, updated_at = NOW() WHERE user_id = ?', [status, user_id]);
    return this.findById(user_id);
  },
  async getAnalytics() {
    const [row] = await query(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) AS disabled
      FROM users`
    );
    return row;
  },
  async updateRole(user_id, role_id) {
    const role = await query('SELECT role_id FROM roles WHERE role_id = ? LIMIT 1', [role_id]);
    if (role.length === 0) {
      throw badRequest('Role not found');
    }
    await query('UPDATE users SET role_id = ?, updated_at = NOW() WHERE user_id = ?', [role_id, user_id]);
    return this.findById(user_id);
  },

  // ==========================================
  // Multi-Role Management (user_roles table)
  // ==========================================

  async getUserRoles(user_id) {
    const sql = `
      SELECT r.role_id, r.name, r.description, ur.assigned_at, ur.assigned_by
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.role_id
      WHERE ur.user_id = ? AND r.is_active = 1
      ORDER BY r.name
    `;
    return query(sql, [user_id]);
  },

  async assignRole(user_id, role_id, assigned_by = null) {
    await query(
      'INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES (?, ?, NOW(), ?)',
      [user_id, role_id, assigned_by]
    );
  },

  async removeRole(user_id, role_id) {
    await query(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [user_id, role_id]
    );
  },

  async syncRoles(user_id, role_ids, assigned_by = null) {
    // Remove all current roles
    await query('DELETE FROM user_roles WHERE user_id = ?', [user_id]);
    
    // Add new roles
    if (role_ids && role_ids.length > 0) {
      const values = role_ids.map(rid => [user_id, rid, assigned_by]);
      const placeholders = values.map(() => '(?, ?, NOW(), ?)').join(', ');
      const flatValues = values.flat();
      
      await query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES ${placeholders}`,
        flatValues
      );
      
      // Update primary role_id in users table (first role)
      await query('UPDATE users SET role_id = ?, updated_at = NOW() WHERE user_id = ?', [role_ids[0], user_id]);
    }
  },

  // ==========================================
  // Direct User Permission Management
  // ==========================================

  async listPermissionsWithAssignment(user_id) {
    return query(
      `SELECT
        p.permission_id,
        p.name,
        p.module,
        p.description,
        CASE WHEN up.permission_id IS NULL THEN 0 ELSE 1 END AS assigned
      FROM permissions p
      LEFT JOIN user_permissions up
        ON up.permission_id = p.permission_id
       AND up.user_id = ?
      WHERE p.is_active = 1
      ORDER BY p.module, p.name`,
      [user_id]
    );
  },

  async getDirectPermissions(user_id) {
    const sql = `
      SELECT p.permission_id, p.name, p.module, p.description, up.assigned_at
      FROM permissions p
      JOIN user_permissions up ON up.permission_id = p.permission_id
      WHERE up.user_id = ? AND p.is_active = 1
      ORDER BY p.module, p.name
    `;
    return query(sql, [user_id]);
  },

  async assignUserPermission(user_id, permission_id) {
    await query(
      'INSERT IGNORE INTO user_permissions (user_id, permission_id, assigned_at) VALUES (?, ?, NOW())',
      [user_id, permission_id]
    );
  },
  async revokeUserPermission(user_id, permission_id) {
    await query('DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?', [user_id, permission_id]);
  }
};

export async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
