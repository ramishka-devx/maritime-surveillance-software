import { NotificationModel } from './notification.model.js';
import { query } from '../../config/db.config.js';
import { emailService } from '../../utils/emailService.js';

export const NotificationService = {
  create: (payload) => NotificationModel.create(payload),

  createNotification: async (userId, type, title, message, entityType = null, entityId = null, priority = 'medium') => {
    // Create the notification in database
    const notification = await NotificationModel.create({
      user_id: userId,
      type,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
      priority
    });

    // Get user email
    try {
      const [user] = await query('SELECT email FROM users WHERE user_id = ?', [userId]);
      if (user && user.email) {
        // Send email notification
        await emailService.sendNotificationEmail(user.email, {
          type,
          title,
          message,
          priority
        });
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the notification creation if email fails
    }

    return notification;
  },

  listByUser: (userId, filters) => NotificationModel.listByUser(userId, filters),

  getById: (id) => NotificationModel.getById(id),

  markAsRead: (id, userId) => NotificationModel.markAsRead(id, userId),

  markAllAsRead: (userId) => NotificationModel.markAllAsRead(userId),

  getUnreadCount: (userId) => NotificationModel.getUnreadCount(userId),

  remove: (id, userId) => NotificationModel.remove(id, userId)
};