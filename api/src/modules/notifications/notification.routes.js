import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { validate } from '../../middleware/validateRequest.js';
import { NotificationController } from './notification.controller.js';
import {
  listSchema, getByIdSchema, markAsReadSchema, deleteSchema
} from './notification.validation.js';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// List notifications for current user
router.get('/',
  authMiddleware,
  permissionMiddleware('notification.list'),
  validate(listSchema),
  NotificationController.list
);

// Get notification by ID (only if belongs to user)
router.get('/:notification_id',
  permissionMiddleware('notification.view'),
  validate(getByIdSchema),
  NotificationController.getById
);

// Mark notification as read
router.put('/:notification_id/read',
  permissionMiddleware('notification.read'),
  validate(markAsReadSchema),
  activityLogger('notification.read'),
  NotificationController.markAsRead
);

// Mark all notifications as read
router.put('/read-all',
  permissionMiddleware('notification.read'),
  NotificationController.markAllAsRead
);

// Get unread count
router.get('/unread/count',
  permissionMiddleware('notification.list'),
  NotificationController.getUnreadCount
);

// Delete notification
router.delete('/:notification_id',
  permissionMiddleware('notification.delete'),
  validate(deleteSchema),
  activityLogger('notification.delete'),
  NotificationController.remove
);

export default router;