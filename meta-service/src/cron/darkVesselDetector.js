import { query } from '../config/db.config.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AlertModel } from '../modules/alerts/alert.model.js';
import { AlertEventModel } from '../modules/alerts/alert-event.model.js';
import { darkVesselTitle, hhmm, motion, vesselLabel } from '../modules/alerts/alert-text.js';

// Dark-vessel detector: a vessel inside a configured sector that was underway and reporting
// steadily, then stopped transmitting.
//
// Our own ingest gaps (restart, websocket drop) must not look like vessels going dark, so a
// vessel only counts if it went quiet while the stream was continuously healthy: healthySince
// is reset whenever the newest position anywhere is older than STREAM_STALE_MS.
// ponytail: per-process health memory; a restart re-waits DARK_SILENCE_MIN before alerting.
const STREAM_STALE_MS = 5 * 60 * 1000;
let healthySince = null;

// A receiver or coverage dropout silences many vessels at once; a vessel switching its
// transponder off is a lone event. Candidates that went quiet in the same 10-minute slot as
// CLUSTER_SIZE or more others are treated as a coverage gap, not dark activity.
// ponytail: time-only clustering; add distance (same receiver area) if sectors get large.
const CLUSTER_SLOT_MS = 10 * 60 * 1000;
const CLUSTER_SIZE = 4;

export function dropCoverageGaps(candidates) {
  const slot = (c) => Math.floor(new Date(c.last_position_at).getTime() / CLUSTER_SLOT_MS);
  const counts = new Map();
  for (const c of candidates) counts.set(slot(c), (counts.get(slot(c)) || 0) + 1);
  return candidates.filter((c) => counts.get(slot(c)) < CLUSTER_SIZE);
}

// One dark_vessel alert for a candidate row (ships + sector name), with its timeline.
export async function raiseDarkVesselAlert(c, creatorId, now = Date.now()) {
  const silentMin = Math.round((now - new Date(c.last_position_at).getTime()) / 60000);
  const how = motion(c.sog, c.cog);
  const alert = await AlertModel.create({
    mmsi: c.mmsi,
    lat: c.lat,
    lon: c.lon,
    type: 'dark_vessel',
    severity: 'high',
    status: 'open',
    title: darkVesselTitle({ vessel: vesselLabel(c.ship_name, c.mmsi), sog: c.sog }).slice(0, 255),
    description:
      `AIS transmissions stopped in ${c.sector}. Last report ${hhmm(c.last_position_at)}${how ? ` ${how}` : ''}. ` +
      `Coordinates: [${Number(c.lat).toFixed(5)}, ${Number(c.lon).toFixed(5)}].`,
    created_by: creatorId,
    assigned_to: null
  });
  if (!alert) return null;
  await AlertEventModel.add({
    alert_id: alert.alert_id,
    kind: 'raised',
    at: c.last_position_at,
    text: `Last AIS transmission${how ? `, ${how}` : ''}.`,
    data: { lat: c.lat, lon: c.lon, sog: c.sog, cog: c.cog }
  });
  await AlertEventModel.add({
    alert_id: alert.alert_id,
    kind: 'observation',
    text: `No transmission for ${silentMin} min inside ${c.sector}; alert raised.`
  });
  return alert;
}

export const runDarkVesselDetector = async () => {
  try {
    const { silenceMin, minSog, minReports, rearmHours } = env.darkVessel;
    const [{ latest }] = await query('SELECT MAX(last_position_at) AS latest FROM ships');
    const now = Date.now();
    if (!latest || now - new Date(latest).getTime() > STREAM_STALE_MS) {
      healthySince = null;
      return;
    }
    if (!healthySince) healthySince = new Date(now);

    const found = await query(
      `SELECT sh.mmsi, sh.ship_name, sh.lat, sh.lon, sh.sog, sh.cog, sh.last_position_at, sc.name AS sector
       FROM ships sh
       JOIN sectors sc ON ST_Intersects(sc.geom, ST_SetSRID(ST_MakePoint(sh.lon, sh.lat), 4326)::geography)
       WHERE sh.lat IS NOT NULL AND sh.lon IS NOT NULL
         AND sh.last_position_at > ?::timestamp
         AND sh.last_position_at < (now() AT TIME ZONE 'UTC') - make_interval(mins => ?)
         AND sh.sog > ?
         AND NOT EXISTS (
           SELECT 1 FROM alerts a
           WHERE a.type = 'dark_vessel' AND a.mmsi = sh.mmsi
             AND a.created_at > now() - make_interval(hours => ?)
         )
         AND (
           SELECT COUNT(*) FROM ais_positions p
           WHERE p.mmsi = sh.mmsi
             AND p.time_utc BETWEEN sh.last_position_at - interval '1 hour' AND sh.last_position_at
         ) >= ?
       ORDER BY sh.last_position_at
       LIMIT 200`,
      [healthySince, silenceMin, minSog, rearmHours, minReports]
    );
    const candidates = dropCoverageGaps(found);
    if (found.length > candidates.length) {
      logger.info({ skipped: found.length - candidates.length }, 'Dark-vessel detector: skipped clustered silences (coverage gap)');
    }
    if (candidates.length === 0) return;

    const [creator] = await query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
    for (const c of candidates) await raiseDarkVesselAlert(c, creator?.user_id || 1, now);
    logger.info({ count: candidates.length }, 'Dark-vessel detector raised alert(s)');
  } catch (err) {
    logger.error({ err }, 'Dark-vessel detector failed');
  }
};
