import { env } from '../config/env.js';
import { query } from '../config/db.config.js';
import { logger } from '../config/logger.js';
import { AlertEventModel } from '../modules/alerts/alert-event.model.js';
import { AlertModel } from '../modules/alerts/alert.model.js';

export const STS_CANDIDATE_QUERY = `
WITH recent AS (
  SELECT mmsi, ship_name, ship_type, sog, lat, lon, position, last_position_at
  FROM ships
  WHERE position IS NOT NULL
    AND last_position_at >= (NOW() AT TIME ZONE 'UTC') - (? * INTERVAL '1 minute')
    AND sog IS NOT NULL
    AND sog < ?
    AND (ship_type IS NULL OR ship_type NOT BETWEEN 50 AND 55)
), candidates AS (
  SELECT
    a.mmsi AS mmsi_a,
    b.mmsi AS mmsi_b,
    a.ship_name AS name_a,
    b.ship_name AS name_b,
    a.position,
    b.position AS position_b,
    ST_Distance(a.position, b.position) AS distance_m,
    ((ST_Y(a.position::geometry) + ST_Y(b.position::geometry)) / 2.0) AS centroid_lat,
    ((ST_X(a.position::geometry) + ST_X(b.position::geometry)) / 2.0) AS centroid_lon,
    GREATEST(a.last_position_at, b.last_position_at) AS observed_at
  FROM recent a
  JOIN recent b ON a.mmsi < b.mmsi
    AND ST_DWithin(a.position, b.position, ?)
  WHERE NOT EXISTS (
    SELECT 1
    FROM restricted_areas r
    WHERE r.status = 'active'
      AND (r.expires_at IS NULL OR r.expires_at > NOW())
      AND LOWER(COALESCE(r.type, '')) IN ('port', 'anchorage', 'harbor', 'harbour')
      AND ST_Intersects(
        r.geom,
        ST_SetSRID(
          ST_MakePoint(
            (ST_X(a.position::geometry) + ST_X(b.position::geometry)) / 2.0,
            (ST_Y(a.position::geometry) + ST_Y(b.position::geometry)) / 2.0
          ), 4326
        )::geography
      )
  )
)
SELECT * FROM candidates`;

function durationMinutes(encounter, at = new Date()) {
  return (new Date(at).getTime() - new Date(encounter.started_at).getTime()) / 60000;
}

async function findActive(mmsiA, mmsiB) {
  const [row] = await query(
    `SELECT * FROM sts_encounters
     WHERE mmsi_a = ? AND mmsi_b = ? AND status <> 'ended'
     ORDER BY started_at DESC LIMIT 1`,
    [mmsiA, mmsiB]
  );
  return row || null;
}

async function upsertEncounter(candidate) {
  const existing = await findActive(candidate.mmsi_a, candidate.mmsi_b);
  if (!existing) {
    const result = await query(
      `INSERT INTO sts_encounters
       (mmsi_a, mmsi_b, started_at, last_seen_together_at, min_distance_m, centroid_lat, centroid_lon)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [candidate.mmsi_a, candidate.mmsi_b, candidate.observed_at, candidate.observed_at,
        candidate.distance_m, candidate.centroid_lat, candidate.centroid_lon]
    );
    return result[0];
  }

  const duration = durationMinutes(existing, candidate.observed_at);
  const status = duration >= env.sts.minimumDurationMinutes ? 'probable' : existing.status;
  const [updated] = await query(
    `UPDATE sts_encounters
     SET last_seen_together_at = GREATEST(last_seen_together_at, ?),
         min_distance_m = LEAST(min_distance_m, ?),
         centroid_lat = ?, centroid_lon = ?, status = ?
     WHERE encounter_id = ?
     RETURNING *`,
    [candidate.observed_at, candidate.distance_m, candidate.centroid_lat, candidate.centroid_lon, status, existing.encounter_id]
  );
  return updated;
}

async function isInsideAuthorisedZone(encounter) {
  const [row] = await query(
    `SELECT 1
     FROM restricted_areas r
     WHERE r.status = 'active'
       AND LOWER(COALESCE(r.type, '')) = 'sts_authorized'
       AND (r.expires_at IS NULL OR r.expires_at > NOW())
       AND ST_Intersects(
         r.geom,
         ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
       )
     LIMIT 1`,
    [encounter.centroid_lon, encounter.centroid_lat]
  );
  return Boolean(row);
}

async function hasCriticalEvidence(encounter) {
  const [row] = await query(
    `SELECT EXISTS (
       SELECT 1 FROM restricted_areas r
       WHERE r.status = 'active'
         AND LOWER(COALESCE(r.type, '')) NOT IN ('port', 'anchorage', 'harbor', 'harbour', 'sts_authorized')
         AND (r.expires_at IS NULL OR r.expires_at > NOW())
         AND ST_Intersects(r.geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)
     ) OR EXISTS (
       SELECT 1 FROM alerts
       WHERE type = 'dark_vessel'
         AND mmsi IN (?, ?)
         AND created_at BETWEEN (?::timestamptz - INTERVAL '2 hours') AND (?::timestamptz + INTERVAL '2 hours')
     ) OR EXISTS (
       SELECT 1 FROM anomalies
       WHERE mmsi IN (?, ?)
         AND detected_at BETWEEN (?::timestamptz - INTERVAL '2 hours') AND (?::timestamptz + INTERVAL '2 hours')
         AND COALESCE(details->>'draught_changed', 'false') = 'true'
     ) AS critical`,
    [encounter.centroid_lon, encounter.centroid_lat,
      encounter.mmsi_a, encounter.mmsi_b, encounter.started_at, encounter.last_seen_together_at,
      encounter.mmsi_a, encounter.mmsi_b, encounter.started_at, encounter.last_seen_together_at]
  );
  return row?.critical === true;
}

async function raiseStsAlert(encounter) {
  const authorised = await isInsideAuthorisedZone(encounter);
  if (authorised) {
    await query('UPDATE sts_encounters SET alerted = TRUE WHERE encounter_id = ?', [encounter.encounter_id]);
    logger.info({ encounterId: encounter.encounter_id }, 'STS encounter ignored inside authorised zone');
    return null;
  }

  const critical = await hasCriticalEvidence(encounter);
  const duration = Math.round(durationMinutes(encounter, encounter.last_seen_together_at));
  const severity = critical ? 'critical' : 'high';
  const title = `Unauthorised STS transfer: MMSI ${encounter.mmsi_a} / ${encounter.mmsi_b}`;
  const description = `Two vessels remained within ${Math.round(encounter.min_distance_m)} m for ${duration} minutes outside an authorised STS zone. ` +
    `Centroid: ${Number(encounter.centroid_lat).toFixed(5)}, ${Number(encounter.centroid_lon).toFixed(5)}.`;
  const [creator] = await query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');

  const anomalyResult = await query(
    `INSERT INTO anomalies (mmsi, anomaly_type, details, lon, lat, detected_at)
     VALUES (?, 'sts_transfer', ?, ?, ?, ?)
     RETURNING anomaly_id`,
    [encounter.mmsi_a, JSON.stringify({
      encounter_id: encounter.encounter_id,
      mmsi_a: encounter.mmsi_a,
      mmsi_b: encounter.mmsi_b,
      started_at: encounter.started_at,
      ended_at: encounter.last_seen_together_at,
      duration_minutes: duration,
      min_distance_m: Number(encounter.min_distance_m),
      critical_evidence: critical,
      draught_changed: false
    }), encounter.centroid_lon, encounter.centroid_lat, encounter.last_seen_together_at]
  );

  const alert = await AlertModel.create({
    type: 'sts_transfer',
    severity,
    status: 'open',
    title,
    description,
    created_by: creator?.user_id || 1,
    mmsi: encounter.mmsi_a,
    lat: encounter.centroid_lat,
    lon: encounter.centroid_lon,
    sts_encounter_id: encounter.encounter_id
  });
  if (alert) {
    await AlertEventModel.add({
      alert_id: alert.alert_id,
      kind: 'raised',
      at: encounter.last_seen_together_at,
      text: `${severity === 'critical' ? 'Critical' : 'High'} STS transfer evidence for MMSIs ${encounter.mmsi_a} and ${encounter.mmsi_b}.`,
      data: { anomaly_id: anomalyResult[0]?.anomaly_id || null, duration_minutes: duration, min_distance_m: encounter.min_distance_m }
    });
  }
  await query('UPDATE sts_encounters SET alerted = TRUE WHERE encounter_id = ?', [encounter.encounter_id]);
  return alert;
}

async function closeSeparatedEncounters() {
  await query(
    `UPDATE sts_encounters e
     SET status = 'ended', ended_at = COALESCE(ended_at, NOW())
     WHERE status IN ('active', 'probable')
       AND (
         last_seen_together_at < (NOW() AT TIME ZONE 'UTC') - (? * INTERVAL '1 minute')
         OR NOT EXISTS (
           SELECT 1 FROM ships a JOIN ships b ON a.mmsi = e.mmsi_a AND b.mmsi = e.mmsi_b
           WHERE a.position IS NOT NULL AND b.position IS NOT NULL
             AND a.last_position_at >= (NOW() AT TIME ZONE 'UTC') - (? * INTERVAL '1 minute')
             AND b.last_position_at >= (NOW() AT TIME ZONE 'UTC') - (? * INTERVAL '1 minute')
             AND ST_DWithin(a.position, b.position, ?)
         )
       )`,
    [env.sts.positionWindowMinutes, env.sts.positionWindowMinutes, env.sts.positionWindowMinutes, env.sts.separationMeters]
  );
}

export async function runStsEncounterDetector() {
  try {
    const candidates = await query(STS_CANDIDATE_QUERY, [
      env.sts.positionWindowMinutes,
      env.sts.slowSpeedKnots,
      env.sts.proximityMeters
    ]);
    for (const candidate of candidates) {
      const encounter = await upsertEncounter(candidate);
      if (!encounter || encounter.alerted || durationMinutes(encounter, encounter.last_seen_together_at) < env.sts.minimumDurationMinutes) continue;
      await raiseStsAlert(encounter);
    }
    await closeSeparatedEncounters();
    if (candidates.length) logger.info({ candidates: candidates.length }, 'STS encounter scan completed');
  } catch (err) {
    logger.error({ err }, 'STS encounter detector failed');
  }
}
