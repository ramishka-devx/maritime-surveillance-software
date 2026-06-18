import { notFound } from '../../utils/errorHandler.js';
import { AnomalyModel } from './anomaly.model.js';
import { AlertModel } from '../alerts/alert.model.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { query } from '../../config/db.config.js';

export const AnomalyService = {
  async create(payload) {
    const anomaly = await AnomalyModel.create(payload);

    try {
      if (payload.anomaly_type === 'speed') {
        const vessel = await VesselModel.findByMmsi(payload.mmsi);
        const vessel_id = vessel ? vessel.vessel_id : null;
        const title = 'Speed Anomaly';

        // Check for active or recent alerts to prevent spam
        const existingAlerts = await query(
          `SELECT alert_id FROM alerts 
           WHERE vessel_id = ? 
             AND title = ? 
             AND (status IN ('open', 'acknowledged') OR created_at > NOW() - INTERVAL '4 hours')
           LIMIT 1`,
          [vessel_id, title]
        );

        if (existingAlerts.length === 0 && vessel_id) {
          const sog = payload.sog ? payload.sog.toFixed(1) : 'Unknown';
          const p99 = payload.p99_speed ? payload.p99_speed.toFixed(1) : 'Unknown';
          
          await AlertModel.create({
            vessel_id,
            type: 'auto',
            severity: 'medium',
            title,
            description: `Abrupt speed change detected. Current speed: ${sog} knots (Expected p99 max: ${p99} knots). This may indicate evasive manoeuvring or mechanical irregularities.`,
          });
        }
      }
    } catch (err) {
      console.error('Error generating alert for speed anomaly:', err);
    }

    return anomaly;
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
