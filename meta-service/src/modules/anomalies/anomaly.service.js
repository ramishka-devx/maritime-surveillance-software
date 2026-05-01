import { notFound } from '../../utils/errorHandler.js';
import { AnomalyModel } from './anomaly.model.js';

export const AnomalyService = {
  async create(payload) {
    return AnomalyModel.create(payload);
  },

  async list(params) {
    return AnomalyModel.list(params);
  },

  async getById(anomaly_id) {
    const anomaly = await AnomalyModel.getById(anomaly_id);
    if (!anomaly) throw notFound('Anomaly not found');
    return anomaly;
  },

  async update(anomaly_id, payload) {
    const existing = await AnomalyModel.getById(anomaly_id);
    if (!existing) throw notFound('Anomaly not found');

    return AnomalyModel.update(anomaly_id, payload);
  },

  async remove(anomaly_id) {
    const existing = await AnomalyModel.getById(anomaly_id);
    if (!existing) throw notFound('Anomaly not found');

    await AnomalyModel.remove(anomaly_id);
  }
};
