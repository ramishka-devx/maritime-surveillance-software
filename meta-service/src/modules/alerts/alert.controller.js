import { success } from '../../utils/apiResponse.js';
import { AlertService } from './alert.service.js';

export const AlertController = {
  async create(req, res, next) {
    try {
      const alert = await AlertService.create(req.body, req.user.user_id);
      return success(res, alert, 'Alert created', 201);
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { page = 1, limit = 10, status, severity, vessel_id, type, mmsi, from, to, sort } = req.query;

      const pageNum = Number.parseInt(page, 10);
      const limitNum = Number.parseInt(limit, 10);
      const vesselIdNum = vessel_id === undefined ? undefined : Number.parseInt(vessel_id, 10);

      const data = await AlertService.list({
        page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10,
        status,
        severity,
        vessel_id: vessel_id === undefined || !Number.isFinite(vesselIdNum) ? undefined : vesselIdNum,
        type: type || undefined,
        mmsi: mmsi || undefined,
        from: from || undefined,
        to: to || undefined,
        sort
      });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const alert = await AlertService.getById(Number(req.params.alert_id));
      return success(res, alert);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const alert = await AlertService.update(Number(req.params.alert_id), req.body);
      return success(res, alert, 'Alert updated');
    } catch (e) {
      next(e);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const alert = await AlertService.updateStatus(Number(req.params.alert_id), req.body.status, req.user.user_id);
      return success(res, alert, 'Status updated');
    } catch (e) {
      next(e);
    }
  },

  async assign(req, res, next) {
    try {
      const alert = await AlertService.assign(Number(req.params.alert_id), Number(req.body.assigned_to), req.user.user_id);
      return success(res, alert, 'Alert assigned');
    } catch (e) {
      next(e);
    }
  },

  async escalate(req, res, next) {
    try {
      const alert = await AlertService.escalate(Number(req.params.alert_id), req.user.user_id, req.body?.note);
      return success(res, alert, 'Alert escalated');
    } catch (e) {
      next(e);
    }
  },

  async events(req, res, next) {
    try {
      const events = await AlertService.events(Number(req.params.alert_id));
      return success(res, events);
    } catch (e) {
      next(e);
    }
  }
};
