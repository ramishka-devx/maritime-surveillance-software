import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { AlertController } from './alert.controller.js';
import {
  listSchema,
  getByIdSchema,
  createSchema,
  updateSchema,
  updateStatusSchema,
  assignSchema
} from './alert.validation.js';

const router = Router();

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: List all alerts
 *     tags: [Alerts]
 */
router.get('/', authMiddleware, permissionMiddleware('alert.view'), validate(listSchema), AlertController.list);

/**
 * @openapi
 * /api/alerts/{alert_id}:
 *   get:
 *     summary: Get alert by ID
 *     tags: [Alerts]
 */
router.get('/:alert_id', authMiddleware, permissionMiddleware('alert.view'), validate(getByIdSchema), AlertController.getById);

/**
 * @openapi
 * /api/alerts:
 *   post:
 *     summary: Create a new alert
 *     tags: [Alerts]
 */
router.post('/', authMiddleware, permissionMiddleware('alert.status.view'), activityLogger('alerts.create'), validate(createSchema), AlertController.create);

/**
 * @openapi
 * /api/alerts/{alert_id}:
 *   put:
 *     summary: Update an alert
 *     tags: [Alerts]
 */
router.put('/:alert_id', authMiddleware, permissionMiddleware('alert.status.view'), activityLogger('alerts.update'), validate(updateSchema), AlertController.update);

/**
 * @openapi
 * /api/alerts/{alert_id}/assign:
 *   put:
 *     summary: Assign alert to a user
 *     tags: [Alerts]
 */
router.put('/:alert_id/assign', authMiddleware, permissionMiddleware('alert.status.view'), activityLogger('alerts.assign'), validate(assignSchema), AlertController.assign);

/**
 * @openapi
 * /api/alerts/{alert_id}/status:
 *   put:
 *     summary: Update alert status (acknowledge/resolve/dismiss)
 *     tags: [Alerts]
 */
router.put('/:alert_id/status', authMiddleware, permissionMiddleware('alert.status.view'), activityLogger('alerts.status'), validate(updateStatusSchema), AlertController.updateStatus);

export default router;
