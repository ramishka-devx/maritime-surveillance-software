import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { DashboardController } from './dashboard.controller.js';
import { summarySchema } from './dashboard.validation.js';

const router = Router();

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     summary: Dashboard figures for a time range (24h, 7d, 30d) - KPIs with previous-period totals, time buckets, alerts by type, top flagged vessels, open queue, vessels per sector and a density grid for one sector (sector_id, default the busiest)
 *     tags: [Dashboard]
 */
router.get('/summary', authMiddleware, permissionMiddleware('dashboard.view'), validate(summarySchema), DashboardController.summary);

export default router;
