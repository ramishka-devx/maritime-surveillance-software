import { badRequest, notFound } from '../../utils/errorHandler.js';
import { VesselModel } from './vessel.model.js';

export const VesselService = {
  async create(payload) {
    const exists = await VesselModel.findByMmsi(payload.mmsi);
    if (exists) throw badRequest('MMSI already exists');
    return VesselModel.create(payload);
  },

  async list(params) {
    return VesselModel.list(params);
  },

  async getById(vessel_id) {
    const vessel = await VesselModel.findById(vessel_id);
    if (!vessel) throw notFound('Vessel not found');
    return vessel;
  },

  async update(vessel_id, payload) {
    const vessel = await VesselModel.findById(vessel_id);
    if (!vessel) throw notFound('Vessel not found');

    if (payload.mmsi && payload.mmsi !== vessel.mmsi) {
      const exists = await VesselModel.findByMmsi(payload.mmsi);
      if (exists) throw badRequest('MMSI already exists');
    }

    return VesselModel.update(vessel_id, payload);
  },

  async remove(vessel_id) {
    const ok = await VesselModel.remove(vessel_id);
    if (!ok) throw notFound('Vessel not found');
    return { deleted: true };
  }
};
