import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { VesselController } from './vessel.controller.js';
import { listSchema, getByIdSchema, createSchema, updateSchema, deleteSchema } from './vessel.validation.js';

const router = Router();

/**
 * @openapi
 * /api/vessels:
 *   get:
 *     summary: List all vessels
 *     tags: [Vessels]
 */
router.get('/', authMiddleware, permissionMiddleware('vessels.list'), validate(listSchema), VesselController.list);

/**
 * @openapi
 * /api/vessels/{vessel_id}:
 *   get:
 *     summary: Get vessel by ID
 *     tags: [Vessels]
 */
router.get('/:vessel_id', authMiddleware, permissionMiddleware('vessels.view'), validate(getByIdSchema), VesselController.getById);

/**
 * @openapi
 * /api/vessels:
 *   post:
 *     summary: Create a new vessel
 *     tags: [Vessels]
 */
router.post('/', authMiddleware, permissionMiddleware('vessels.create'), activityLogger('vessels.create'), validate(createSchema), VesselController.create);

/**
 * @openapi
 * /api/vessels/{vessel_id}:
 *   put:
 *     summary: Update a vessel
 *     tags: [Vessels]
 */
router.put('/:vessel_id', authMiddleware, permissionMiddleware('vessels.update'), activityLogger('vessels.update'), validate(updateSchema), VesselController.update);

/**
 * @openapi
 * /api/vessels/{vessel_id}:
 *   delete:
 *     summary: Delete a vessel
 *     tags: [Vessels]
 */
router.delete('/:vessel_id', authMiddleware, permissionMiddleware('vessels.delete'), activityLogger('vessels.delete'), validate(deleteSchema), VesselController.remove);

export default router;
