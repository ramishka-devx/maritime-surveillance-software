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

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: List notifications for current user
 *     tags: [Notifications]
 */
router.get('/',
  permissionMiddleware('notifications.view'),
  validate(listSchema),
  NotificationController.list
);

/**
 * @openapi
 * /api/notifications/unread/count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 */
router.get('/unread/count',
  permissionMiddleware('notifications.view'),
  NotificationController.getUnreadCount
);

/**
 * @openapi
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 */
router.put('/read-all',
  permissionMiddleware('notifications.view'),
  NotificationController.markAllAsRead
);

/**
 * @openapi
 * /api/notifications/{notification_id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 */
router.get('/:notification_id',
  permissionMiddleware('notifications.view'),
  validate(getByIdSchema),
  NotificationController.getById
);

/**
 * @openapi
 * /api/notifications/{notification_id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 */
router.put('/:notification_id/read',
  permissionMiddleware('notifications.view'),
  validate(markAsReadSchema),
  activityLogger('notifications.read'),
  NotificationController.markAsRead
);

/**
 * @openapi
 * /api/notifications/{notification_id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 */
router.delete('/:notification_id',
  permissionMiddleware('notifications.delete'),
  validate(deleteSchema),
  activityLogger('notifications.delete'),
  NotificationController.remove
);

export default router;