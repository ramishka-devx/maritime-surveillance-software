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

  async update(req, res, next) {
    try {
      const area = await RestrictedAreaService.update(Number(req.params.id), req.body);
      return success(res, area, 'Restricted area updated');
    } catch (e) { next(e); }
  },

  async remove(req, res, next) {
    try {
      const result = await RestrictedAreaService.remove(Number(req.params.id));
      return success(res, result, 'Restricted area deleted');
    } catch (e) { next(e); }
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
  },

  async checkBreaches(req, res, next) {
    try {
      const alerts = await RestrictedAreaService.checkAndCreateGeofenceAlerts({
        forceScan: Boolean(req.body?.forceScan),
        limit: req.body?.limit ? Number.parseInt(req.body.limit, 10) : undefined
      });

      return success(
        res,
        { count: alerts.length, alerts },
        'Geofence breach check completed'
      );
    } catch (e) {
      next(e);
    }
  }
};
