import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { ReportController } from './report.controller.js';
import { dailyActivitySchema, alertHistorySchema } from './report.validation.js';

const router = Router();

/**
 * @openapi
 * /api/reports/daily-activity.csv:
 *   get:
 *     summary: Daily Activity CSV (REQ-F-060) - one row per vessel seen on a UTC day with position count, min/max SOG and first/last observed position. Header-only when the day has no data (ais_positions keeps 2 days). 503 if the report doesn't start within 5 s.
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: '2026-11-04' }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv: {}
 */
router.get(
  '/daily-activity.csv',
  authMiddleware,
  permissionMiddleware('report.download'),
  activityLogger('report.download', { details: (req) => ({ report: 'daily_activity', date: req.query.date }) }),
  validate(dailyActivitySchema),
  ReportController.dailyActivity
);

/**
 * @openapi
 * /api/reports/alert-history.csv:
 *   get:
 *     summary: Alert History CSV (REQ-F-061) - one row per alert raised between two UTC days (inclusive, at most 92 days) with type, MMSI, vessel, severity, confidence score, status and who acknowledged it when. Optionally only some types, severities or statuses (comma-separated). 503 if the report doesn't start within 5 s.
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date, example: '2026-10-05' }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date, example: '2026-11-04' }
 *       - in: query
 *         name: type
 *         schema: { type: string, example: 'speed,loitering' }
 *         description: geofence, speed, collision_risk, dark_vessel, manual, loitering, route_deviation
 *       - in: query
 *         name: severity
 *         schema: { type: string, example: 'high,critical' }
 *         description: low, medium, high, critical
 *       - in: query
 *         name: status
 *         schema: { type: string, example: 'open,acknowledged' }
 *         description: open, acknowledged, escalated, resolved, dismissed
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv: {}
 */
router.get(
  '/alert-history.csv',
  authMiddleware,
  permissionMiddleware('report.download'),
  activityLogger('report.download', {
    details: (req) => {
      const { from, to, type, severity, status } = req.query;
      return { report: 'alert_history', from, to, type, severity, status };
    }
  }),
  validate(alertHistorySchema),
  ReportController.alertHistory
);

export default router;
