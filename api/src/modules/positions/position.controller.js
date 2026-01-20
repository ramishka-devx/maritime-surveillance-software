import { success } from '../../utils/apiResponse.js';
import { PositionService } from './position.service.js';

export const PositionController = {
  async createForVessel(req, res, next) {
    try {
      const pos = await PositionService.createForVessel(Number(req.params.vessel_id), req.body);
      return success(res, pos, 'Position created', 201);
    } catch (e) {
      next(e);
    }
  },

  async listForVessel(req, res, next) {
    try {
      const { page = 1, limit = 25, from, to } = req.query;
      const data = await PositionService.listForVessel(Number(req.params.vessel_id), {
        page: Number(page),
        limit: Number(limit),
        from,
        to
      });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async latestForVessel(req, res, next) {
    try {
      const pos = await PositionService.latestForVessel(Number(req.params.vessel_id));
      return success(res, pos);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const pos = await PositionService.getById(Number(req.params.position_id));
      return success(res, pos);
    } catch (e) {
      next(e);
    }
  }
};
