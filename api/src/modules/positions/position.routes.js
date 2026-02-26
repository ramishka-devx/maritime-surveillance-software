import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { PositionController } from './position.controller.js';
import {
  createForVesselSchema,
  listForVesselSchema,
  latestForVesselSchema,
  getByIdSchema
} from './position.validation.js';

const router = Router();

/**
 * @openapi
 * /api/vessels/{vessel_id}/positions:
 *   post:
 *     summary: Create a position record for a vessel
 *     tags: [Positions]
 */
router.post(
  '/vessels/:vessel_id/positions',
  authMiddleware,
  permissionMiddleware('vessels.positions.create'),
  activityLogger('vessels.positions.create'),
  validate(createForVesselSchema),
  PositionController.createForVessel
);

/**
 * @openapi
 * /api/vessels/{vessel_id}/positions:
 *   get:
 *     summary: List position history for a vessel
 *     tags: [Positions]
 */
router.get(
  '/vessels/:vessel_id/positions',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  validate(listForVesselSchema),
  PositionController.listForVessel
);

/**
 * @openapi
 * /api/vessels/{vessel_id}/positions/latest:
 *   get:
 *     summary: Get latest position for a vessel
 *     tags: [Positions]
 */
router.get(
  '/vessels/:vessel_id/positions/latest',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  validate(latestForVesselSchema),
  PositionController.latestForVessel
);

/**
 * @openapi
 * /api/positions/{position_id}:
 *   get:
 *     summary: Get position by ID
 *     tags: [Positions]
 */
router.get(
  '/positions/:position_id',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  validate(getByIdSchema),
  PositionController.getById
);

export default router;
