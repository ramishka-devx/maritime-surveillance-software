import { query, pool } from '../src/config/db.config.js';

const DEMO_TAG = '[demo-dashboard]';
const DEMO_MMSIS = ['244999901', '244999902', '244999903', '244999904', '244999905'];
const NOW = new Date();
const ADMIN_ID = 1;

const ships = [
  { mmsi: DEMO_MMSIS[0], name: 'MV Serenguard Trader', type: 70, lat: 6.72, lon: 79.78, sog: 1.2 },
  { mmsi: DEMO_MMSIS[1], name: 'MV Ocean Sentinel', type: 71, lat: 6.7212, lon: 79.7812, sog: 1.1 },
  { mmsi: DEMO_MMSIS[2], name: 'MV Ceylon Horizon', type: 70, lat: 6.94, lon: 79.82, sog: 0.4 },
  { mmsi: DEMO_MMSIS[3], name: 'MV Southern Cross', type: 80, lat: 7.08, lon: 79.91, sog: 12.4 },
  { mmsi: DEMO_MMSIS[4], name: 'MV Draught Meridian', type: 70, lat: 6.61, lon: 79.76, sog: 8.2 }
];

const iso = (minutesAgo) => new Date(NOW.getTime() - minutesAgo * 60_000);
const json = (value) => JSON.stringify(value);

async function clearDemo() {
  const alerts = await query('SELECT alert_id FROM alerts WHERE description LIKE ?', [`%${DEMO_TAG}%`]);
  const alertIds = alerts.map(({ alert_id }) => alert_id);
  if (alertIds.length) {
    await query("DELETE FROM notifications WHERE entity_type = 'alert' AND entity_id = ANY(?::int[])", [alertIds]);
    await query('DELETE FROM alert_events WHERE alert_id = ANY(?::int[])', [alertIds]);
    await query('DELETE FROM alerts WHERE alert_id = ANY(?::int[])', [alertIds]);
  }
  await query("DELETE FROM anomalies WHERE details->>'demo_tag' = ?", [DEMO_TAG]);
  await query('DELETE FROM sts_encounters WHERE mmsi_a = ? AND mmsi_b = ?', [DEMO_MMSIS[0], DEMO_MMSIS[1]]);
  await query('DELETE FROM ais_positions WHERE mmsi = ANY(?::bigint[])', [DEMO_MMSIS]);
  await query('DELETE FROM restricted_areas WHERE name LIKE ?', ['Demo dashboard: %']);
  await query('DELETE FROM ships WHERE mmsi = ANY(?::bigint[])', [DEMO_MMSIS]);
  console.log(`Cleared ${alertIds.length} demo alerts and prior demo entities.`);
}

async function insertAlert({ type, severity, title, description, mmsi, lat, lon, restrictedAreaId = null, stsEncounterId = null, details, at }) {
  const result = await query(
    `INSERT INTO alerts
      (type, severity, status, title, description, created_by, mmsi, restricted_area_id,
       sts_encounter_id, lat, lon, created_at, updated_at)
     VALUES (?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING alert_id AS insert_id`,
    [type, severity, title, `${description} ${DEMO_TAG}`, ADMIN_ID, mmsi, restrictedAreaId, stsEncounterId, lat, lon, at, at]
  );
  const alertId = result.insertId;
  await query(
    `INSERT INTO alert_events (alert_id, at, kind, text, actor_id, data)
     VALUES (?, ?, 'raised', ?, NULL, ?)`,
    [alertId, at, title, details ? json(details) : null]
  );
  console.log(`Created alert #${alertId}: ${type}/${severity}`);
  return alertId;
}

async function seedShips() {
  await query("INSERT INTO ship_types (ship_type_id, description) VALUES (70, 'Cargo, all ships of this type'), (71, 'Cargo, hazardous category A'), (80, 'Tanker, all ships of this type') ON CONFLICT (ship_type_id) DO NOTHING");
  for (const ship of ships) {
    await query(
      `INSERT INTO ships
        (mmsi, ship_name, ship_type, dimensions, imo, callsign, destination, draught,
         lat, lon, position, sog, cog, heading, nav_status, last_position_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
               ?, ?, ?, 0, ?, ?, ?)
       ON CONFLICT (mmsi) DO UPDATE SET
         ship_name = EXCLUDED.ship_name, ship_type = EXCLUDED.ship_type,
         dimensions = EXCLUDED.dimensions, imo = EXCLUDED.imo, callsign = EXCLUDED.callsign,
         destination = EXCLUDED.destination, draught = EXCLUDED.draught, lat = EXCLUDED.lat,
         lon = EXCLUDED.lon, position = EXCLUDED.position, sog = EXCLUDED.sog, cog = EXCLUDED.cog,
         heading = EXCLUDED.heading, nav_status = EXCLUDED.nav_status,
         last_position_at = EXCLUDED.last_position_at, updated_at = EXCLUDED.updated_at`,
      [ship.mmsi, ship.name, ship.type, json({ length_m: 180, width_m: 28 }), `IMO${ship.mmsi.slice(-7)}`, `SG${ship.mmsi.slice(-5)}`,
        'Colombo', ship.mmsi === DEMO_MMSIS[4] ? 12.5 : 8.2, ship.lat, ship.lon, ship.lon, ship.lat,
        ship.sog, ship.mmsi === DEMO_MMSIS[2] ? 0.3 : 92, 90, iso(2), iso(60 * 24), iso(2)]
    );
  }

  for (const ship of ships) {
    for (let index = 0; index < 6; index += 1) {
      const at = iso(45 - index * 8);
      const lat = ship.lat + (index * 0.00015);
      const lon = ship.lon + (index * 0.00015);
      await query(
        `INSERT INTO ais_positions
          (mmsi, ship_name, sog, cog, heading, nav_status, lon, lat, position, time_utc, width, length, ship_type)
         VALUES (?, ?, ?, ?, 90, 0, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326), ?, 28, 180, ?)`,
        [ship.mmsi, ship.name, ship.sog, ship.mmsi === DEMO_MMSIS[2] ? 12 : 92, lon, lat, lon, lat, at, ship.type]
      );
    }
  }
}

async function seed() {
  await clearDemo();
  await seedShips();

  const { insertId: zoneId } = await query(
    `INSERT INTO restricted_areas (name, type, status, geom, expires_at)
     VALUES ('Demo dashboard: Colombo security exclusion', 'military', 'active',
       ST_GeogFromText(?), NULL)
     RETURNING id`,
    ['POLYGON((79.80 6.90, 79.84 6.90, 79.84 6.94, 79.80 6.94, 79.80 6.90))']
  );

  const { insertId: encounterId } = await query(
    `INSERT INTO sts_encounters
      (mmsi_a, mmsi_b, started_at, last_seen_together_at, min_distance_m,
       centroid_lat, centroid_lon, status, alerted)
     VALUES (?, ?, ?, ?, 140, 6.7206, 79.7806, 'probable', TRUE)
     RETURNING encounter_id`,
    [DEMO_MMSIS[0], DEMO_MMSIS[1], iso(90), iso(45)]
  );

  await query(
    `INSERT INTO anomalies (mmsi, anomaly_type, details, lon, lat, detected_at)
     VALUES (?, 'sts_transfer', ?, 79.7806, 6.7206, ?)`,
    [DEMO_MMSIS[0], json({ demo_tag: DEMO_TAG, encounter_id: encounterId, mmsi_a: DEMO_MMSIS[0], mmsi_b: DEMO_MMSIS[1], duration_minutes: 45, min_distance_m: 140 }), iso(44)]
  );
  await insertAlert({
    type: 'sts_transfer', severity: 'critical', title: 'Critical STS transfer: Serenguard Trader / Ocean Sentinel',
    description: 'Two cargo vessels remained 140 m apart for 45 minutes off Colombo. Suspected unauthorised transfer.',
    mmsi: DEMO_MMSIS[0], lat: 6.7206, lon: 79.7806, stsEncounterId: encounterId,
    details: { mmsi_a: DEMO_MMSIS[0], mmsi_b: DEMO_MMSIS[1], duration_minutes: 45, min_distance_m: 140, centroid: [6.7206, 79.7806] }, at: iso(44)
  });

  await insertAlert({
    type: 'geofence', severity: 'high', title: 'Restricted area breach: Ceylon Horizon',
    description: `Vessel entered active restricted area ${zoneId} at ${iso(70).toISOString()}.`,
    mmsi: DEMO_MMSIS[2], lat: 6.925, lon: 79.82, restrictedAreaId: zoneId,
    details: { restricted_area_id: zoneId, entry_time: iso(70).toISOString() }, at: iso(68)
  });

  await insertAlert({
    type: 'dark_vessel', severity: 'high', title: 'Dark AIS activity: Southern Cross',
    description: 'AIS gap of 12 hours. Last known position 6.9800, 79.8600; reappearance position 7.0800, 79.9100.',
    mmsi: DEMO_MMSIS[3], lat: 7.08, lon: 79.91,
    details: { gap_hours: 12, last_known_position: [6.98, 79.86], reappearance_position: [7.08, 79.91] }, at: iso(180)
  });

  await insertAlert({
    type: 'loitering', severity: 'medium', title: 'Loitering detected: Ceylon Horizon',
    description: 'Vessel remained below 1 knot for 4 hours outside a port area.',
    mmsi: DEMO_MMSIS[2], lat: 6.94, lon: 79.82,
    details: { duration_hours: 4, maximum_sog_knots: 0.8, outside_port: true }, at: iso(260)
  });

  await query(
    `INSERT INTO anomalies (mmsi, anomaly_type, details, lon, lat, detected_at)
     VALUES (?, 'route', ?, 79.76, 6.61, ?)`,
    [DEMO_MMSIS[4], json({ demo_tag: DEMO_TAG, type: 'type_draught_mismatch', reported_draught_m: 12.5, expected_draught_m: 8.5, evidence: 'historical dimensions conflict' }), iso(95)]
  );
  await insertAlert({
    type: 'speed', severity: 'medium', title: 'Draught mismatch: Draught Meridian',
    description: 'Reported draught conflicts with historical vessel dimensions and cargo profile.',
    mmsi: DEMO_MMSIS[4], lat: 6.61, lon: 79.76,
    details: { anomaly_type: 'type_draught_mismatch', reported_draught_m: 12.5, expected_draught_m: 8.5 }, at: iso(95)
  });

  const counts = await query(`SELECT type, severity, COUNT(*)::int AS count FROM alerts WHERE description LIKE ? GROUP BY type, severity ORDER BY type, severity`, [`%${DEMO_TAG}%`]);
  console.log('DEMO_ALERT_COUNTS');
  console.table(counts);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
