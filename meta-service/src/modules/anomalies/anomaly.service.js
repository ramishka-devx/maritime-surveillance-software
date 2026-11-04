import { notFound } from '../../utils/errorHandler.js';
import { AnomalyModel } from './anomaly.model.js';
import { AlertModel } from '../alerts/alert.model.js';
import { AlertEventModel } from '../alerts/alert-event.model.js';
import { anomalyTitle, kn, motion, vesselLabel } from '../alerts/alert-text.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { query } from '../../config/db.config.js';
import { logger } from '../../config/logger.js';
import { DetectionSettingsService } from '../detection-settings/detection-settings.service.js';

// Alert raised for each anomaly type ('behavoir' (sic) is the stored behaviour type).
export const ANOMALY_ALERT = {
  speed: { type: 'speed', severity: 'high', label: 'Speed anomaly' },
  route: { type: 'route_deviation', severity: 'medium', label: 'Route deviation' },
  behavoir: { type: 'loitering', severity: 'medium', label: 'Loitering' },
  loitering: { type: 'loitering', severity: 'medium', label: 'Loitering' }
};

// Speed alerts take their severity from the anomaly score; without a score (rule-based
// detectors, or the speed detector running without a model) the type's default applies.
export function alertSeverity(kind, score, highSeverityScore) {
  if (kind.type === 'speed' && score !== undefined && score !== null) {
    return score >= highSeverityScore ? 'high' : 'medium';
  }
  return kind.severity;
}

export const AnomalyService = {
  async create(payload, created_by) {
    const anomaly = await AnomalyModel.create(payload);

    try {
      const kind = ANOMALY_ALERT[payload.anomaly_type] || ANOMALY_ALERT.speed;
      const settings = await DetectionSettingsService.values();

      // Cooldown: a vessel that keeps tripping the same detector adds observations to its
      // unresolved alert instead of flooding the queue with new ones.
      const cooldown = settings['alerts.cooldown_minutes'];
      if (cooldown > 0 && payload.mmsi) {
        const recent = await AlertModel.findRecentOpen({ mmsi: payload.mmsi, type: kind.type, minutes: cooldown });
        if (recent) {
          await AlertEventModel.add({
            alert_id: recent.alert_id,
            kind: 'observation',
            at: payload.detected_at || null,
            text: `Detected again${payload.sog != null ? ` at ${payload.sog} kn` : ''}${
              payload.score != null ? ` (score ${Number(payload.score).toFixed(2)})` : ''
            }.`,
            data: { anomaly_id: anomaly?.anomaly_id ?? null, sog: payload.sog ?? null, score: payload.score ?? null }
          });
          return { ...anomaly, alert_id: recent.alert_id };
        }
      }

      // 1. Resolve vessel_id if this MMSI exists in vessels table
      let vesselId = null;
      let vesselName = null;
      if (payload.mmsi) {
        const vessel = await VesselModel.findByMmsi(String(payload.mmsi));
        if (vessel) {
          vesselId = vessel.vessel_id;
          vesselName = vessel.name;
        }
        if (!vesselName) {
          const [ship] = await query('SELECT ship_name FROM ships WHERE mmsi = ?', [payload.mmsi]);
          vesselName = ship?.ship_name || null;
        }
      }

      // 2. Resolve created_by user (from caller token or fallback to system user)
      let creatorId = created_by;
      if (!creatorId) {
        const [defaultUser] = await query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
        creatorId = defaultUser?.user_id || 1;
      }

      // 3. Format the alert title and description for this anomaly type
      const vesselDisplay = vesselName ? `${vesselName} (${payload.mmsi})` : `MMSI ${payload.mmsi}`;
      const sogText = payload.sog !== undefined && payload.sog !== null ? `${payload.sog} kn` : null;
      const p99Text = payload.p99_speed !== undefined && payload.p99_speed !== null ? `${payload.p99_speed} kn` : null;
      const cogText = payload.cog !== undefined && payload.cog !== null ? `${payload.cog}°` : null;

      const title = anomalyTitle(payload.anomaly_type, {
        vessel: vesselLabel(vesselName, payload.mmsi),
        sog: payload.sog,
        p99: payload.p99_speed
      });

      const descParts = [
        `Automated ${kind.label.toLowerCase()} detected by analytic-service for ${vesselDisplay}.`,
        sogText ? `Observed SOG: ${sogText}.` : null,
        p99Text ? `Vessel-type p99 speed threshold: ${p99Text}.` : null,
        payload.score != null ? `Anomaly score: ${Number(payload.score).toFixed(3)}.` : null,
        cogText ? `Course over ground: ${cogText}.` : null,
        payload.details ? `Diagnostics: ${JSON.stringify(payload.details)}` : null
      ].filter(Boolean);

      const alert = await AlertModel.create({
        vessel_id: vesselId,
        mmsi: payload.mmsi,
        lat: payload.lat ?? null,
        lon: payload.lon ?? null,
        confidence_score: payload.score ?? null,
        type: kind.type,
        severity: alertSeverity(kind, payload.score, settings['speed.high_severity_score']),
        status: 'open',
        title: title.slice(0, 255),
        description: descParts.join(' '),
        created_by: creatorId,
        assigned_to: null
      });

      if (alert) {
        const how = motion(payload.sog, payload.cog);
        const norm = kn(payload.p99_speed) ? `; similar vessels stay under ${kn(payload.p99_speed)}` : '';
        await AlertEventModel.add({
          alert_id: alert.alert_id,
          kind: 'raised',
          at: payload.detected_at || null,
          text: `analytic-service flagged ${kind.label.toLowerCase()}${how ? `, ${how}` : ''}${norm}.`.replace(/^a/, 'A'),
          data: {
            anomaly_id: anomaly?.anomaly_id ?? null,
            sog: payload.sog ?? null,
            p99_speed: payload.p99_speed ?? null,
            score: payload.score ?? null,
            model_version: payload.model_version ?? null
          }
        });
      }

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
