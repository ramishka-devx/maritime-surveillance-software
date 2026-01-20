import { success } from '../../utils/apiResponse.js';
import { NotificationService } from './notification.service.js';

export const NotificationController = {
  async list(req, res, next) {
    try {
      const data = await NotificationService.listByUser(req.user.user_id, req.query);
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await NotificationService.getById(Number(req.params.notification_id));
      if (!data) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      // Check if notification belongs to user
      if (data.user_id !== req.user.user_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const success = await NotificationService.markAsRead(
        Number(req.params.notification_id),
        req.user.user_id
      );
      if (!success) {
        return res.status(404).json({ message: 'Notification not found or access denied' });
      }
      return success(res, null, 'Notification marked as read');
    } catch (e) {
      next(e);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const count = await NotificationService.markAllAsRead(req.user.user_id);
      return success(res, { marked_read: count }, 'All notifications marked as read');
    } catch (e) {
      next(e);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.user_id);
      return success(res, { unread_count: count });
    } catch (e) {
      next(e);
    }
  },

  async remove(req, res, next) {
    try {
      const success = await NotificationService.remove(
        Number(req.params.notification_id),
        req.user.user_id
      );
      if (!success) {
        return res.status(404).json({ message: 'Notification not found or access denied' });
      }
      return success(res, null, 'Notification deleted successfully');
    } catch (e) {
      next(e);
    }
  }
};