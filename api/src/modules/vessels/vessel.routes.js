import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { VesselController } from './vessel.controller.js';
import { listSchema, getByIdSchema, createSchema, updateSchema, deleteSchema } from './vessel.validation.js';

const router = Router();

router.get('/', authMiddleware, permissionMiddleware('vessel.list'), validate(listSchema), VesselController.list);
router.get('/:vessel_id', authMiddleware, permissionMiddleware('vessel.view'), validate(getByIdSchema), VesselController.getById);
router.post('/', authMiddleware, permissionMiddleware('vessel.create'), activityLogger('vessel.create'), validate(createSchema), VesselController.create);
router.put('/:vessel_id', authMiddleware, permissionMiddleware('vessel.update'), activityLogger('vessel.update'), validate(updateSchema), VesselController.update);
router.delete('/:vessel_id', authMiddleware, permissionMiddleware('vessel.delete'), activityLogger('vessel.delete'), validate(deleteSchema), VesselController.remove);

export default router;
