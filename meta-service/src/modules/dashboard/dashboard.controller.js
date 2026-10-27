import { success } from '../../utils/apiResponse.js';
import { DashboardService } from './dashboard.service.js';

export const DashboardController = {
  async summary(req, res, next) {
    try {
      const { range, sector_id } = req.query;
      const data = await DashboardService.summary({ range, sector_id });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  }
};
