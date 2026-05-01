import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { AnomalyController } from './anomaly.controller.js';
import {
  listSchema,
  getByIdSchema,
  createSchema,
  updateSchema,
  deleteSchema
} from './anomaly.validation.js';

const router = Router();

/**
 * @openapi
 * /api/anomalies:
 *   get:
 *     summary: List speed anomalies
 *     tags: [Anomalies]
 */
router.get('/', authMiddleware, permissionMiddleware('anomalies.view'), validate(listSchema), AnomalyController.list);

/**
 * @openapi
 * /api/anomalies/{anomaly_id}:
 *   get:
 *     summary: Get anomaly by ID
 *     tags: [Anomalies]
 */
router.get('/:anomaly_id', authMiddleware, permissionMiddleware('anomalies.view'), validate(getByIdSchema), AnomalyController.getById);

/**
 * @openapi
 * /api/anomalies:
 *   post:
 *     summary: Create a new anomaly
 *     tags: [Anomalies]
 */
router.post(
  '/',
  authMiddleware,
  permissionMiddleware('anomalies.create'),
  activityLogger('anomalies.create'),
  validate(createSchema),
  AnomalyController.create
);

/**
 * @openapi
 * /api/anomalies/{anomaly_id}:
 *   put:
 *     summary: Update an anomaly
 *     tags: [Anomalies]
 */
router.put(
  '/:anomaly_id',
  authMiddleware,
  permissionMiddleware('anomalies.update'),
  activityLogger('anomalies.update'),
  validate(updateSchema),
  AnomalyController.update
);

/**
 * @openapi
 * /api/anomalies/{anomaly_id}:
 *   delete:
 *     summary: Delete an anomaly
 *     tags: [Anomalies]
 */
router.delete(
  '/:anomaly_id',
  authMiddleware,
  permissionMiddleware('anomalies.delete'),
  activityLogger('anomalies.delete'),
  validate(deleteSchema),
  AnomalyController.remove
);

export default router;
