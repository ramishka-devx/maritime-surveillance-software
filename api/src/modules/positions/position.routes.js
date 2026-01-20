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

// Vessel-scoped positions
router.post(
  '/vessels/:vessel_id/positions',
  authMiddleware,
  permissionMiddleware('position.create'),
  activityLogger('position.create'),
  validate(createForVesselSchema),
  PositionController.createForVessel
);

router.get(
  '/vessels/:vessel_id/positions',
  authMiddleware,
  permissionMiddleware('position.list'),
  validate(listForVesselSchema),
  PositionController.listForVessel
);

router.get(
  '/vessels/:vessel_id/positions/latest',
  authMiddleware,
  permissionMiddleware('position.view'),
  validate(latestForVesselSchema),
  PositionController.latestForVessel
);

// Direct lookup
router.get(
  '/positions/:position_id',
  authMiddleware,
  permissionMiddleware('position.view'),
  validate(getByIdSchema),
  PositionController.getById
);

export default router;
