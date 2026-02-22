import { success } from '../../utils/apiResponse.js';
import { AisService } from './ais.service.js';

export const AisController = {
  async listVessels(req, res, next) {
    try {
      const { limit } = req.query;
      const data = await AisService.listVessels({ limit });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async latestPositions(req, res, next) {
    try {
      const { limit } = req.query;
      const data = await AisService.latestPositions({ limit });
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
