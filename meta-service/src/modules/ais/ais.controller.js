import { success } from '../../utils/apiResponse.js';
import { AisService } from './ais.service.js';

export const AisController = {
  async rate(req, res, next) {
    try {
      const data = await AisService.rate();
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async listVessels(req, res, next) {
    try {
      const { limit, q } = req.query;
      const data = await AisService.listVessels({ limit, q });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async latestPositions(req, res, next) {
    try {
      const { limit, bbox } = req.query;
      const data = await AisService.latestPositions({ limit, bbox });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async positionsByMmsi(req, res, next) {
    try {
      const { mmsi } = req.params;
      const { limit } = req.query;
      const data = await AisService.positionsByMmsi(mmsi, { limit });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },
};
