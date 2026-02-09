import { badRequest, notFound } from '../../utils/errorHandler.js';
import { AlertModel } from './alert.model.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { UserModel } from '../users/user.model.js';

export const AlertService = {
  async create(payload, created_by) {
    if (payload.vessel_id !== undefined && payload.vessel_id !== null) {
      const vessel = await VesselModel.findById(payload.vessel_id);
      if (!vessel) throw notFound('Vessel not found');
    }

    if (payload.assigned_to !== undefined && payload.assigned_to !== null) {
      const user = await UserModel.findById(payload.assigned_to);
      if (!user) throw notFound('Assignee not found');
    }

    return AlertModel.create({ ...payload, created_by });
  },

  async list(params) {
    return AlertModel.list(params);
  },

  async getById(alert_id) {
    const alert = await AlertModel.getById(alert_id);
    if (!alert) throw notFound('Alert not found');
    return alert;
  },

  async update(alert_id, payload) {
    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');

    if (payload.vessel_id !== undefined && payload.vessel_id !== null) {
      const vessel = await VesselModel.findById(payload.vessel_id);
      if (!vessel) throw notFound('Vessel not found');
    }

    return AlertModel.update(alert_id, payload);
  },

  async updateStatus(alert_id, status) {
    const allowed = ['open', 'acknowledged', 'resolved', 'dismissed'];
    if (!allowed.includes(status)) throw badRequest('Invalid status');

    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');

    return AlertModel.updateStatus(alert_id, status);
  },

  async assign(alert_id, assigned_to) {
    const existing = await AlertModel.getById(alert_id);
    if (!existing) throw notFound('Alert not found');

    const user = await UserModel.findById(assigned_to);
    if (!user) throw notFound('Assignee not found');

    return AlertModel.assign(alert_id, assigned_to);
  }
};
