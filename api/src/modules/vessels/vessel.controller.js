import { success } from '../../utils/apiResponse.js';
import { VesselService } from './vessel.service.js';

export const VesselController = {
  async create(req, res, next) {
    try {
      const vessel = await VesselService.create(req.body);
      return success(res, vessel, 'Vessel created', 201);
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { page = 1, limit = 10, q } = req.query;
      const data = await VesselService.list({ page: Number(page), limit: Number(limit), q });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const vessel = await VesselService.getById(Number(req.params.vessel_id));
      return success(res, vessel);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const vessel = await VesselService.update(Number(req.params.vessel_id), req.body);
      return success(res, vessel, 'Vessel updated');
    } catch (e) {
      next(e);
    }
  },

  async remove(req, res, next) {
    try {
      const result = await VesselService.remove(Number(req.params.vessel_id));
      return success(res, result, 'Vessel deleted');
    } catch (e) {
      next(e);
    }
  }
};
