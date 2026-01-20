import { query } from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { badRequest } from '../../utils/errorHandler.js';

export const UserModel = {
  async create({ first_name, last_name, email, password_hash, role_id }) {
    const sql = `INSERT INTO users (first_name, last_name, email, password_hash, role_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
    const result = await query(sql, [first_name, last_name, email, password_hash, role_id]);
    return { user_id: result.insertId, first_name, last_name, email, role_id };
  },
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0];
  },
  async findById(user_id) {
    const rows = await query('SELECT u.user_id, u.first_name, u.last_name, u.email, u.role_id, u.status, r.name as role, u.profileImg, u.created_at, u.updated_at FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ? LIMIT 1', [user_id]);
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
        SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) AS deleted
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
  }
};

export async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
