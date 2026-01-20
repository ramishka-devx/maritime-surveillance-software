import { success } from '../../utils/apiResponse.js';
import { ActivityService } from './activity.service.js';

export const ActivityController = {
  async list(req, res, next) {
    try {
      const data = await ActivityService.list(req.query);
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await ActivityService.getById(Number(req.params.activity_id));
      if (!data) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      return success(res, data);
    } catch (e) {
      next(e);
    }
  }
};