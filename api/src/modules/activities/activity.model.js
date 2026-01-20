import { query } from '../../config/db.config.js';

export const ActivityModel = {
  async list({
    page = 1,
    limit = 10,
    user_id,
    permission_id,
    method,
    path,
    status_code,
    date_from,
    date_to,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = {}) {
    const where = [];
    const params = [];

    if (user_id !== undefined) {
      where.push('a.user_id = ?');
      params.push(user_id);
    }
    if (permission_id !== undefined) {
      where.push('a.permission_id = ?');
      params.push(permission_id);
    }
    if (method !== undefined) {
      where.push('a.method = ?');
      params.push(method);
    }
    if (path !== undefined) {
      where.push('a.path LIKE ?');
      params.push(`%${path}%`);
    }
    if (status_code !== undefined) {
      where.push('a.status_code = ?');
      params.push(status_code);
    }
    if (date_from) {
      where.push('a.created_at >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('a.created_at <= ?');
      params.push(date_to);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const validSortColumns = ['created_at', 'method', 'path', 'status_code'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*) as total
      FROM activities a
      ${whereClause}
    `;

    const [{ total }] = await query(countSql, params);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const sql = `
      SELECT
        a.activity_id, a.user_id, a.permission_id, a.method, a.path,
        a.status_code, a.created_at,
        u.first_name, u.last_name, u.email,
        p.name as permission_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.user_id
      LEFT JOIN permissions p ON a.permission_id = p.permission_id
      ${whereClause}
      ORDER BY a.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const activities = await query(sql, params);

    return {
      data: activities.map((row) => ({
        activity_id: row.activity_id,
        user: {
          user_id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email
        },
        permission: row.permission_id ? {
          permission_id: row.permission_id,
          name: row.permission_name
        } : null,
        method: row.method,
        path: row.path,
        status_code: row.status_code,
        created_at: row.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getById(activity_id) {
    const sql = `
      SELECT
        a.activity_id, a.user_id, a.permission_id, a.method, a.path,
        a.status_code, a.created_at,
        u.first_name, u.last_name, u.email,
        p.name as permission_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.user_id
      LEFT JOIN permissions p ON a.permission_id = p.permission_id
      WHERE a.activity_id = ?
    `;

    const [activity] = await query(sql, [activity_id]);

    if (!activity) return null;

    return {
      activity_id: activity.activity_id,
      user: {
        user_id: activity.user_id,
        first_name: activity.first_name,
        last_name: activity.last_name,
        email: activity.email
      },
      permission: activity.permission_id ? {
        permission_id: activity.permission_id,
        name: activity.permission_name
      } : null,
      method: activity.method,
      path: activity.path,
      status_code: activity.status_code,
      created_at: activity.created_at
    };
  }
};