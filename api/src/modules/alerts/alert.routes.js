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

router.get('/', authMiddleware, permissionMiddleware('alert.list'), validate(listSchema), AlertController.list);
router.get('/:alert_id', authMiddleware, permissionMiddleware('alert.view'), validate(getByIdSchema), AlertController.getById);
router.post('/', authMiddleware, permissionMiddleware('alert.create'), activityLogger('alert.create'), validate(createSchema), AlertController.create);

// Super-admin level operations
router.put('/:alert_id', authMiddleware, permissionMiddleware('alert.update'), activityLogger('alert.update'), validate(updateSchema), AlertController.update);
router.put('/:alert_id/assign', authMiddleware, permissionMiddleware('alert.assign'), activityLogger('alert.assign'), validate(assignSchema), AlertController.assign);

// Operator can update status (acknowledge/resolve/dismiss)
router.put('/:alert_id/status', authMiddleware, permissionMiddleware('alert.updateStatus'), activityLogger('alert.updateStatus'), validate(updateStatusSchema), AlertController.updateStatus);

export default router;
