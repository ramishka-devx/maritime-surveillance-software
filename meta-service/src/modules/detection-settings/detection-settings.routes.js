import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { DetectionSettingsController } from './detection-settings.controller.js';
import { updateSchema, overrideSchema, reportComputedSchema } from './detection-settings.validation.js';

const router = Router();

// Every admin change is audited with its before/after values (REQ-F-083).
const audited = activityLogger('detection.manage', { details: (req, res) => res.locals.audit ?? null });

/**
 * @openapi
 * /api/detection-settings:
 *   get:
 *     summary: Detector settings (score thresholds, cooldowns, loitering rule) with defaults and who last changed each, p99 speed thresholds per vessel-type group (computed and admin override), and the last 20 admin changes. analytic-service polls `values`.
 *     tags: [Detection settings]
 *   put:
 *     summary: Change detector settings (admins only, REQ-F-047). Body is { key - value } for the keys returned by GET; each is validated, the warning threshold must not exceed the alert threshold, and the high-severity score must be at least the alert threshold. Audited with before/after values.
 *     tags: [Detection settings]
 */
router.get('/', authMiddleware, permissionMiddleware('detection.view'), DetectionSettingsController.get);
router.put(
  '/',
  authMiddleware,
  permissionMiddleware('detection.manage'),
  audited,
  validate(updateSchema),
  DetectionSettingsController.update
);

/**
 * @openapi
 * /api/detection-settings/thresholds/{type_group}:
 *   put:
 *     summary: Set or clear (null) the admin override of a vessel-type group's p99 speed threshold in knots (admins only). Audited.
 *     tags: [Detection settings]
 */
router.put(
  '/thresholds/:type_group',
  authMiddleware,
  permissionMiddleware('detection.manage'),
  audited,
  validate(overrideSchema),
  DetectionSettingsController.setOverride
);

/**
 * @openapi
 * /api/detection-settings/computed-thresholds:
 *   put:
 *     summary: analytic-service reports the p99 speed per vessel-type group after each model refit (detection.report). Admin overrides are left alone.
 *     tags: [Detection settings]
 */
router.put(
  '/computed-thresholds',
  authMiddleware,
  permissionMiddleware('detection.report'),
  validate(reportComputedSchema),
  DetectionSettingsController.reportComputed
);

export default router;
