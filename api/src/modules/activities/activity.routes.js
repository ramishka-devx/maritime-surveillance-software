import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { ActivityController } from './activity.controller.js';
import { listSchema, getByIdSchema } from './activity.validation.js';

const router = Router();

/**
 * @openapi
 * /api/activities:
 *   get:
 *     summary: List activity logs
 *     tags: [Activities]
 */
router.get('/',
  authMiddleware,
  permissionMiddleware('reports.view'),
  validate(listSchema),
  ActivityController.list
);

/**
 * @openapi
 * /api/activities/{activity_id}:
 *   get:
 *     summary: Get activity log by ID
 *     tags: [Activities]
 */
router.get('/:activity_id',
  authMiddleware,
  permissionMiddleware('reports.view'),
  validate(getByIdSchema),
  ActivityController.getById
);

export default router;