import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { RestrictedAreaController } from './restricted-area.controller.js';
import {
  listSchema,
  getByIdSchema,
  createSchema,
  updateSchema,
  detectionsSchema,
  checkBreachesSchema
} from './restricted-area.validation.js';

const router = Router();

/**
 * @openapi
 * /api/restricted-areas:
 *   get:
 *     summary: List restricted areas
 *     tags: [Restricted Areas]
 */
router.get('/', authMiddleware, validate(listSchema), RestrictedAreaController.list);

/**
 * @openapi
 * /api/restricted-areas:
 *   post:
 *     summary: Create a restricted area
 *     tags: [Restricted Areas]
 */
router.post('/', authMiddleware, activityLogger('restricted_areas.create'), validate(createSchema), RestrictedAreaController.create);
router.put('/:id', authMiddleware, activityLogger('restricted_areas.update'), validate(updateSchema), RestrictedAreaController.update);
router.delete('/:id', authMiddleware, activityLogger('restricted_areas.delete'), validate(getByIdSchema), RestrictedAreaController.remove);

/**
 * @openapi
 * /api/restricted-areas/detections:
 *   get:
 *     summary: Detect ships inside restricted areas
 *     tags: [Restricted Areas]
 */
router.get('/detections', authMiddleware, validate(detectionsSchema), RestrictedAreaController.detectEntries);

/**
 * @openapi
 * /api/restricted-areas/check-breaches:
 *   post:
 *     summary: Run geofence detector and dispatch alerts for breaches
 *     tags: [Restricted Areas]
 */
router.post(
  '/check-breaches',
  authMiddleware,
  activityLogger('restricted_areas.check_breaches'),
  validate(checkBreachesSchema),
  RestrictedAreaController.checkBreaches
);

/**
 * @openapi
 * /api/restricted-areas/{id}:
 *   get:
 *     summary: Get restricted area by ID
 *     tags: [Restricted Areas]
 */
router.get('/:id', authMiddleware, validate(getByIdSchema), RestrictedAreaController.getById);

export default router;
