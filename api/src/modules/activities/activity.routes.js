import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { ActivityController } from './activity.controller.js';
import { listSchema, getByIdSchema } from './activity.validation.js';

const router = Router();

router.get('/',
  authMiddleware,
  permissionMiddleware('activity.list'),
  validate(listSchema),
  ActivityController.list
);

router.get('/:activity_id',
  authMiddleware,
  permissionMiddleware('activity.view'),
  validate(getByIdSchema),
  ActivityController.getById
);

export default router;