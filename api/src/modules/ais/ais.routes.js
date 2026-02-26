import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { AisController } from './ais.controller.js';

const router = Router();

// Read-only endpoints backed by api-init's ais_positions table.
router.get('/vessels', authMiddleware, permissionMiddleware('dashboard.view'), AisController.listVessels);
router.get('/positions/latest', authMiddleware, permissionMiddleware('dashboard.view'), AisController.latestPositions);
router.get('/positions/:mmsi', authMiddleware, permissionMiddleware('dashboard.view'), AisController.positionsByMmsi);

export default router;
