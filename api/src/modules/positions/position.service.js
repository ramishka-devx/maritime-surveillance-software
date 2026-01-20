import { notFound } from '../../utils/errorHandler.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { PositionModel } from './position.model.js';

export const PositionService = {
  async createForVessel(vessel_id, payload) {
    const vessel = await VesselModel.findById(vessel_id);
    if (!vessel) throw notFound('Vessel not found');
    return PositionModel.create(vessel_id, payload);
  },

  async listForVessel(vessel_id, params) {
    const vessel = await VesselModel.findById(vessel_id);
    if (!vessel) throw notFound('Vessel not found');
    return PositionModel.listByVessel(vessel_id, params);
  },

  async getById(position_id) {
    const pos = await PositionModel.getById(position_id);
    if (!pos) throw notFound('Position not found');
    return pos;
  },

  async latestForVessel(vessel_id) {
    const vessel = await VesselModel.findById(vessel_id);
    if (!vessel) throw notFound('Vessel not found');
    const pos = await PositionModel.latestByVessel(vessel_id);
    if (!pos) throw notFound('No positions for vessel');
    return pos;
  }
};
