import { success } from '../../utils/apiResponse.js';
import { DetectionSettingsService } from './detection-settings.service.js';

// Admin changes put their before/after values in res.locals.audit for activityLogger.
export const DetectionSettingsController = {
  async get(req, res, next) {
    try {
      return success(res, await DetectionSettingsService.get());
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const changes = await DetectionSettingsService.update(req.body, req.user.user_id);
      res.locals.audit = { settings: changes };
      return success(res, await DetectionSettingsService.get(), changes.length ? 'Settings saved' : 'No changes');
    } catch (e) {
      next(e);
    }
  },

  async setOverride(req, res, next) {
    try {
      const { threshold, change } = await DetectionSettingsService.setOverride(
        Number(req.params.type_group),
        req.body.p99_override,
        req.user.user_id
      );
      res.locals.audit = { threshold: change };
      return success(res, threshold, 'Threshold saved');
    } catch (e) {
      next(e);
    }
  },

  async reportComputed(req, res, next) {
    try {
      await DetectionSettingsService.reportComputed(req.body.thresholds);
      return success(res, { count: req.body.thresholds.length });
    } catch (e) {
      next(e);
    }
  }
};
