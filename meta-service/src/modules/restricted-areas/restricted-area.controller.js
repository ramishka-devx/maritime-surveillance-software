import { success } from '../../utils/apiResponse.js';
import { RestrictedAreaService } from './restricted-area.service.js';

export const RestrictedAreaController = {
  async create(req, res, next) {
    try {
      const area = await RestrictedAreaService.create(req.body);
      return success(res, area, 'Restricted area created', 201);
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const areas = await RestrictedAreaService.list(req.query);
      return success(res, areas);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const area = await RestrictedAreaService.getById(Number(req.params.id));
      return success(res, area);
    } catch (e) {
      next(e);
    }
  },

  async detectEntries(req, res, next) {
    try {
      const data = await RestrictedAreaService.detectEntries({
        restricted_area_id:
          req.query.restricted_area_id === undefined
            ? undefined
            : Number.parseInt(req.query.restricted_area_id, 10),
        mmsi: req.query.mmsi || undefined,
        limit: Number.parseInt(req.query.limit, 10)
      });

      return success(res, data);
    } catch (e) {
      next(e);
    }
  }
};
