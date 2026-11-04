import { logger } from '../../config/logger.js';
import { ReportService } from './report.service.js';

// Before the first byte the error middleware can still answer with JSON; after it, the
// only honest option is to cut the connection so the client sees a failed download.
function failed(res, next, err) {
  if (!res.headersSent) return next(err);
  logger.error({ err }, 'Report download failed mid-stream');
  res.destroy();
}

export const ReportController = {
  async dailyActivity(req, res, next) {
    try {
      await ReportService.dailyActivity(res, req.query.date);
    } catch (e) {
      failed(res, next, e);
    }
  },

  async alertHistory(req, res, next) {
    try {
      const { from, to } = req.query;
      await ReportService.alertHistory(res, from, to);
    } catch (e) {
      failed(res, next, e);
    }
  }
};
