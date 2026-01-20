import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { PermissionController } from './permission.controller.js';
import { createSchema, assignSchema } from './permission.validation.js';

const router = Router();

router.post('/', authMiddleware, permissionMiddleware('permission.add'), activityLogger('permission.add'), validate(createSchema), PermissionController.create);
router.get('/', authMiddleware, permissionMiddleware('permission.list'), PermissionController.list);
router.delete('/:permission_id', authMiddleware, permissionMiddleware('permission.delete'), activityLogger('permission.delete'), PermissionController.remove);
router.post('/assign', authMiddleware, permissionMiddleware('permission.assign'), activityLogger('permission.assign'), validate(assignSchema), PermissionController.assign);
router.post('/revoke', authMiddleware, permissionMiddleware('permission.revoke'), activityLogger('permission.revoke'), validate(assignSchema), PermissionController.revoke);

export default router;
