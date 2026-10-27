import { badRequest, notFound } from '../../utils/errorHandler.js';
import { RestrictedAreaModel } from './restricted-area.model.js';
import { AlertModel } from '../alerts/alert.model.js';
import { AlertEventModel } from '../alerts/alert-event.model.js';
import { geofenceTitle, hhmm, kn, motion, vesselLabel } from '../alerts/alert-text.js';
import { VesselModel } from '../vessels/vessel.model.js';
import { query } from '../../config/db.config.js';
import { logger } from '../../config/logger.js';

let lastCheckedWatermark = null;

function normalizeCoordinate(value) {
  return Number.parseFloat(Number(value).toFixed(6));
}

function buildPolygonWkt(coordinates) {
  const normalized = coordinates.map(({ lat, lon }) => ({
    lat: normalizeCoordinate(lat),
    lon: normalizeCoordinate(lon)
  }));

  const uniqueVertices = new Set(normalized.map(({ lat, lon }) => `${lon},${lat}`));
  if (uniqueVertices.size < 3) {
    throw badRequest('At least 3 distinct coordinates are required to form a polygon');
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const closed =
    first.lat === last.lat && first.lon === last.lon
      ? normalized
      : [...normalized, first];

  const points = closed.map(({ lat, lon }) => `${lon} ${lat}`).join(', ');
  return `POLYGON((${points}))`;
}

function parseGeometry(area) {
  if (!area) return area;

  return {
    ...area,
    geometry: area.geometry ? JSON.parse(area.geometry) : null
  };
}

export const RestrictedAreaService = {
  async create(payload) {
    const wktPolygon = buildPolygonWkt(payload.coordinates);
    const area = await RestrictedAreaModel.create({
      name: payload.name,
      type: payload.type,
      wktPolygon
    });

    return parseGeometry(area);
  },

  async list({ type } = {}) {
    const rows = await RestrictedAreaModel.list({ type: type || undefined });
    return rows.map(parseGeometry);
  },

  async getById(id) {
    const area = await RestrictedAreaModel.getById(id);
    if (!area) throw notFound('Restricted area not found');
    return parseGeometry(area);
  },

  async detectEntries(params = {}) {
    return RestrictedAreaModel.detectEntries({
      restricted_area_id: params.restricted_area_id,
      mmsi: params.mmsi,
      limit: params.limit
    });
  },

  // Timeline for a new geofence alert: the entry, and the last position before it that was
  // still outside the zone (looked up within 6 h so only recent partitions are scanned).
  async recordBreachEvents(alertId, breach) {
    try {
      const entered = breach.time_utc ? new Date(breach.time_utc) : new Date();
      const how = motion(breach.sog, breach.cog);
      await AlertEventModel.add({
        alert_id: alertId,
        kind: 'raised',
        at: entered,
        text: `Entered ${breach.restricted_zone}${how ? ` ${how}` : ''}.`,
        data: { lat: breach.lat, lon: breach.lon, sog: breach.sog, cog: breach.cog }
      });

      const [outside] = await query(
        `SELECT p.time_utc, p.sog
         FROM ais_positions p, restricted_areas r
         WHERE r.id = ?
           AND p.mmsi = ?
           AND p.time_utc < ?::timestamp
           AND p.time_utc > ?::timestamp - interval '6 hours'
           AND NOT ST_Intersects(p.position, r.geom)
         ORDER BY p.time_utc DESC
         LIMIT 1`,
        [breach.restricted_area_id, breach.mmsi, entered, entered]
      );
      await AlertEventModel.add({
        alert_id: alertId,
        kind: 'observation',
        at: outside ? outside.time_utc : entered,
        text: outside
          ? `Last position outside the zone, ${kn(outside.sog) ? `at ${kn(outside.sog)}` : 'speed unknown'} (${hhmm(outside.time_utc)}).`
          : 'No position outside the zone in the 6 h before entry; the vessel was first seen inside it.'
      });
    } catch (err) {
      logger.warn({ err, alertId }, 'Could not record geofence alert events');
    }
  },

  async checkAndCreateGeofenceAlerts({ sinceTime, limit = 100, forceScan = false } = {}) {
    let scanSince = sinceTime;

    if (!scanSince && !forceScan) {
      if (!lastCheckedWatermark) {
        // First run on startup: sync watermark with data
        const [latestPos] = await query('SELECT MAX(time_utc) as max_time FROM ais_positions');
        if (latestPos?.max_time) {
          const maxTime = new Date(latestPos.max_time);
          const now = new Date();
          if (now.getTime() - maxTime.getTime() < 60 * 60 * 1000) {
            lastCheckedWatermark = new Date(now.getTime() - 15 * 60 * 1000);
          } else {
            lastCheckedWatermark = new Date(maxTime.getTime() - 15 * 60 * 1000);
          }
        } else {
          lastCheckedWatermark = new Date(Date.now() - 15 * 60 * 1000);
        }
      }
      scanSince = lastCheckedWatermark;
    }

    const breaches = await RestrictedAreaModel.detectBreaches({
      sinceTime: scanSince,
      limit
    });

    if (!breaches || breaches.length === 0) {
      const [latestPos] = await query('SELECT MAX(time_utc) as max_time FROM ais_positions');
      if (latestPos?.max_time) {
        const maxTime = new Date(latestPos.max_time);
        lastCheckedWatermark = new Date(Math.max(Date.now() - 15 * 60 * 1000, maxTime.getTime() - 15 * 60 * 1000));
      } else {
        lastCheckedWatermark = new Date(Date.now() - 15 * 60 * 1000);
      }
      return [];
    }

    const [defaultUser] = await query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
    const creatorId = defaultUser?.user_id || 1;

    const createdAlerts = [];
    let newestTime = null;

    for (const breach of breaches) {
      const breachTime = breach.time_utc ? new Date(breach.time_utc) : null;
      if (breachTime && (!newestTime || breachTime > newestTime)) {
        newestTime = breachTime;
      }

      const mmsi = String(breach.mmsi);

      let vesselId = null;
      let vesselName = breach.ship_name || null;
      try {
        const vessel = await VesselModel.findByMmsi(mmsi);
        if (vessel) {
          vesselId = vessel.vessel_id;
          if (vessel.name) vesselName = vessel.name;
        }
      } catch (err) {
        logger.warn({ err, mmsi }, 'Could not resolve vessel for geofence breach');
      }

      // One open alert per vessel and zone within 2 hours.
      const existingAlerts = await query(
        `SELECT alert_id FROM alerts
         WHERE type = 'geofence'
           AND status IN ('open', 'acknowledged')
           AND mmsi = ?
           AND restricted_area_id = ?
           AND created_at >= NOW() - INTERVAL '2 hours'
         LIMIT 1`,
        [breach.mmsi, breach.restricted_area_id]
      );

      if (existingAlerts.length > 0) {
        continue;
      }

      const areaType = String(breach.restricted_area_type || '').toLowerCase();
      const isHighRisk = ['military', 'security', 'danger', 'defense', 'prohibited'].some((k) =>
        areaType.includes(k)
      );
      const severity = isHighRisk ? 'critical' : 'high';

      const vesselDisplay = vesselName ? `${vesselName} (${mmsi})` : `MMSI ${mmsi}`;
      const title = geofenceTitle({
        vessel: vesselLabel(vesselName, mmsi),
        zone: breach.restricted_zone,
        sog: breach.sog
      }).slice(0, 255);

      const latStr = breach.lat != null ? Number(breach.lat).toFixed(5) : 'N/A';
      const lonStr = breach.lon != null ? Number(breach.lon).toFixed(5) : 'N/A';
      const sogStr = breach.sog != null ? `${breach.sog} kn` : null;
      const cogStr = breach.cog != null ? `${breach.cog}°` : null;
      const timeStr = breach.time_utc ? new Date(breach.time_utc).toISOString() : null;

      const descParts = [
        `Unauthorized entry detected in restricted area "${breach.restricted_zone}" (Type: ${breach.restricted_area_type || 'Restricted Area'}).`,
        `Target: ${vesselDisplay}.`,
        `Coordinates: [${latStr}, ${lonStr}].`,
        sogStr ? `Speed: ${sogStr}.` : null,
        cogStr ? `Course: ${cogStr}.` : null,
        timeStr ? `Observed: ${timeStr}.` : null
      ].filter(Boolean);

      try {
        const alert = await AlertModel.create({
          vessel_id: vesselId,
          mmsi: breach.mmsi,
          restricted_area_id: breach.restricted_area_id,
          lat: breach.lat,
          lon: breach.lon,
          type: 'geofence',
          severity,
          status: 'open',
          title,
          description: descParts.join(' '),
          created_by: creatorId,
          assigned_to: null
        });

        if (alert) {
          createdAlerts.push(alert);
          await this.recordBreachEvents(alert.alert_id, breach);
        }
      } catch (err) {
        logger.error({ err, mmsi, zone: breach.restricted_zone }, 'Failed to create geofence alert');
      }
    }

    if (newestTime) {
      lastCheckedWatermark = new Date(newestTime.getTime() + 1000);
    }

    return createdAlerts;
  }
};
