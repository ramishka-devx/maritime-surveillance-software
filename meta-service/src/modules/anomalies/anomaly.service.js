import { notFound } from '../../utils/errorHandler.js';
import { AnomalyModel } from './anomaly.model.js';
import { AlertModel } from '../alerts/alert.model.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { query } from '../../config/db.config.js';
import { logger } from '../../config/logger.js';

export const AnomalyService = {
  async create(payload, created_by) {
    const anomaly = await AnomalyModel.create(payload);

    try {
      // 1. Resolve vessel_id if this MMSI exists in vessels table
      let vesselId = null;
      let vesselName = null;
      if (payload.mmsi) {
        const vessel = await VesselModel.findByMmsi(String(payload.mmsi));
        if (vessel) {
          vesselId = vessel.vessel_id;
          vesselName = vessel.name;
        }
      }

      // 2. Resolve created_by user (from caller token or fallback to system user)
      let creatorId = created_by;
      if (!creatorId) {
        const [defaultUser] = await query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
        creatorId = defaultUser?.user_id || 1;
      }

      // 3. Format speed anomaly title and description
      const vesselDisplay = vesselName ? `${vesselName} (${payload.mmsi})` : `MMSI ${payload.mmsi}`;
      const sogText = payload.sog !== undefined && payload.sog !== null ? `${payload.sog} kn` : null;
      const p99Text = payload.p99_speed !== undefined && payload.p99_speed !== null ? `${payload.p99_speed} kn` : null;
      const cogText = payload.cog !== undefined && payload.cog !== null ? `${payload.cog}°` : null;

      const title = `Speed Anomaly: ${vesselDisplay}${sogText ? ` observed at ${sogText}` : ''}`;

      const descParts = [
        `Automated speed anomaly detected by analytic-service for ${vesselDisplay}.`,
        sogText ? `Observed SOG: ${sogText}.` : null,
        p99Text ? `Peer p99 speed threshold: ${p99Text}.` : null,
        cogText ? `Course over ground: ${cogText}.` : null,
        payload.details ? `Diagnostics: ${JSON.stringify(payload.details)}` : null
      ].filter(Boolean);

      const alert = await AlertModel.create({
        vessel_id: vesselId,
        type: 'speed',
        severity: 'high',
        status: 'open',
        title: title.slice(0, 255),
        description: descParts.join(' '),
        created_by: creatorId,
        assigned_to: null
      });

      return {
        ...anomaly,
        alert_id: alert?.alert_id
      };
    } catch (err) {
      logger.error({ err, mmsi: payload.mmsi }, 'Failed to automatically create alert for anomaly');
      return anomaly;
    }
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
