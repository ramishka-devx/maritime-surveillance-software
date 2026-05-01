import { success } from '../../utils/apiResponse.js';
import { AnomalyService } from './anomaly.service.js';

export const AnomalyController = {
  async create(req, res, next) {
    try {
      const anomaly = await AnomalyService.create(req.body);
      return success(res, anomaly, 'Anomaly created', 201);
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 25,
        mmsi,
        from,
        to,
        anomaly_type
      } = req.query;

      const pageNum = Number.parseInt(page, 10);
      const limitNum = Number.parseInt(limit, 10);
      const mmsiNum = mmsi === undefined ? undefined : Number.parseInt(mmsi, 10);

      const data = await AnomalyService.list({
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 25,
        mmsi: mmsi === undefined || !Number.isFinite(mmsiNum) ? undefined : mmsiNum,
        from,
        to,
        anomaly_type
      });

      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const anomaly = await AnomalyService.getById(Number(req.params.anomaly_id));
      return success(res, anomaly);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const anomaly = await AnomalyService.update(Number(req.params.anomaly_id), req.body);
      return success(res, anomaly, 'Anomaly updated');
    } catch (e) {
      next(e);
    }
  },

  async remove(req, res, next) {
    try {
      await AnomalyService.remove(Number(req.params.anomaly_id));
      return success(res, { success: true }, 'Anomaly deleted');
    } catch (e) {
      next(e);
    }
  }
};
