import { query } from '../../config/db.config.js';

export const NotificationModel = {
  async create(notificationData) {
    const {
      user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      priority = 'medium'
    } = notificationData;

    const sql = `
      INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id, priority,
        is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())
    `;

    const result = await query(sql, [
      user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      priority
    ]);

    return { notification_id: result.insertId, ...notificationData, is_read: 0 };
  },

  async listByUser(userId, { page = 1, limit = 10, is_read } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (is_read !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(is_read ? 1 : 0);
    }

    const sql = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const notifications = await query(sql, params);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
    const [countResult] = await query(countSql, params.slice(0, -2)); // Remove limit and offset

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  },

  async getById(notificationId) {
    const sql = 'SELECT * FROM notifications WHERE notification_id = ?';
    const [notification] = await query(sql, [notificationId]);
    return notification;
  },

  async markAsRead(notificationId, userId) {
    const sql = `
      UPDATE notifications
      SET is_read = 1, read_at = NOW()
      WHERE notification_id = ? AND user_id = ?
    `;
    const result = await query(sql, [notificationId, userId]);
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId) {
    const sql = `
      UPDATE notifications
      SET is_read = 1, read_at = NOW()
      WHERE user_id = ? AND is_read = 0
    `;
    const result = await query(sql, [userId]);
    return result.affectedRows;
  },

  async getUnreadCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0';
    const [result] = await query(sql, [userId]);
    return result.count;
  },

  async remove(notificationId, userId) {
    const sql = 'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?';
    const result = await query(sql, [notificationId, userId]);
    return result.affectedRows > 0;
  }
};