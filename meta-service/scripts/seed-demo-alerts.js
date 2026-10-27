// Demo alerts for the Alerts page, built on real vessels from the live AIS data (ships +
// ais_positions) so the case file has real tracks, positions, IMO and flag.
//
//   npm run db:seed-demo-alerts            add a fresh set (clears the previous demo set first)
//   npm run db:seed-demo-alerts -- --clear remove the demo set
//
// Needs recent AIS positions (ingest-service running for an hour or so). Demo rows are marked:
// alert descriptions end with DEMO_TAG and demo zones are named "Demo: ...". The live geofence
// cron may raise real alerts for other vessels inside a demo zone; --clear removes those too.
import { query, pool } from '../src/config/db.config.js';
import { anomalyTitle, darkVesselTitle, geofenceTitle, hhmm, kn, motion, vesselLabel } from '../src/modules/alerts/alert-text.js';

const DEMO_TAG = '[demo]';
const MIN = 60 * 1000;
const UTC_NOW = "(now() AT TIME ZONE 'UTC')";
// AIS uses 102.3 kn for "speed not available"; anything above this is not a real speed.
const MAX_REAL_SOG = 60;

async function clear() {
  const zones = await query("SELECT id FROM restricted_areas WHERE name LIKE 'Demo: %'");
  const zoneIds = zones.map((z) => z.id);
  const alerts = await query(
    `SELECT alert_id FROM alerts WHERE description LIKE ? OR restricted_area_id = ANY(?::int[])`,
    [`%${DEMO_TAG}`, zoneIds]
  );
  const ids = alerts.map((a) => a.alert_id);
  if (ids.length) {
    await query("DELETE FROM notifications WHERE entity_type = 'alert' AND entity_id = ANY(?::int[])", [ids]);
    await query('DELETE FROM alerts WHERE alert_id = ANY(?::int[])', [ids]); // alert_events cascade
  }
  if (zoneIds.length) await query('DELETE FROM restricted_areas WHERE id = ANY(?::int[])', [zoneIds]);
  console.log(`Removed ${ids.length} demo alert(s) and ${zoneIds.length} demo zone(s).`);
}

// Positions of a vessel over the last 3 h, oldest first.
const trackOf = (mmsi) =>
  query(
    `SELECT time_utc, lat, lon, sog, cog FROM ais_positions
     WHERE mmsi = ? AND time_utc > ${UTC_NOW} - interval '3 hours' AND lat IS NOT NULL
     ORDER BY time_utc`,
    [mmsi]
  );

// The sector with the most vessels reporting in the last hour.
async function busiestSector() {
  const [sector] = await query(
    `SELECT sc.id FROM sectors sc
     LEFT JOIN ships sh ON sh.last_position_at > ${UTC_NOW} - interval '1 hour'
      AND ST_Intersects(sc.geom, ST_SetSRID(ST_MakePoint(sh.lon, sh.lat), 4326)::geography)
     GROUP BY sc.id ORDER BY COUNT(sh.mmsi) DESC LIMIT 1`
  );
  if (!sector) throw new Error('No sectors defined; run the DashboardGaps migration first.');
  return sector.id;
}

// Vessels reporting steadily in the last 3 h inside the sector, with their track stats.
function pickVessels(sectorId) {
  return query(
    `SELECT s.mmsi, s.ship_name, s.ship_type, s.last_position_at, s.sog AS last_sog,
            COUNT(*)::int AS n,
            MAX(p.sog) FILTER (WHERE p.sog < ${MAX_REAL_SOG})::float AS max_sog,
            AVG(p.sog) FILTER (WHERE p.sog < ${MAX_REAL_SOG})::float AS avg_sog
     FROM ais_positions p
     JOIN ships s ON s.mmsi = p.mmsi
     JOIN sectors sc ON sc.id = ? AND ST_Intersects(sc.geom, p.position)
     WHERE p.time_utc > ${UTC_NOW} - interval '3 hours'
       AND s.ship_name IS NOT NULL AND s.ship_name !~ '^[0-9 ]*$'
     GROUP BY s.mmsi, s.ship_name, s.ship_type, s.last_position_at, s.sog
     HAVING COUNT(*) >= 10 AND MAX(p.sog) < ${MAX_REAL_SOG}
     ORDER BY random()
     LIMIT 600`,
    [sectorId]
  );
}

// The db.config shim appends RETURNING alert_id and hands back { insertId }.
async function insertAlert(a) {
  const { insertId: alertId } = await query(
    `INSERT INTO alerts (type, severity, status, title, description, created_by, assigned_to,
                         mmsi, restricted_area_id, lat, lon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
    [
      a.type, a.severity, a.status, a.title.slice(0, 255), `${a.description} ${DEMO_TAG}`,
      a.assigned_to ?? null, a.mmsi, a.restricted_area_id ?? null, a.lat, a.lon, a.at, a.at
    ]
  );
  for (const e of a.events) {
    await query(
      'INSERT INTO alert_events (alert_id, at, kind, text, actor_id, data) VALUES (?, ?, ?, ?, ?, ?)',
      [alertId, e.at, e.kind, e.text, e.actor ?? null, e.data ? JSON.stringify(e.data) : null]
    );
  }
  console.log(`  #${alertId} ${a.severity.padEnd(8)} ${a.status.padEnd(12)} ${a.title}`);
  return alertId;
}

const later = (t, minutes) => new Date(new Date(t).getTime() + minutes * MIN);
const pointAt = (track, frac) => track[Math.min(track.length - 1, Math.floor(track.length * frac))];
// Same, but only among positions where the vessel was under way (> 3 kn, a real speed).
const underwayAt = (track, frac) => {
  const moving = track.filter((x) => Number(x.sog) > 3 && Number(x.sog) < MAX_REAL_SOG);
  return pointAt(moving.length ? moving : track, frac);
};
const ADMIN = 1;
const OPERATOR = 2;

async function seed() {
  await clear();
  const sectorId = await busiestSector();
  const vessels = await pickVessels(sectorId);
  if (vessels.length < 10) throw new Error('Not enough recent AIS data; let ingest-service run for a while first.');
  const used = new Set();
  const take = (pred) => {
    const v = vessels.find((x) => !used.has(String(x.mmsi)) && pred(x));
    if (v) used.add(String(v.mmsi));
    return v;
  };
  const moving = (x) => x.avg_sog > 5 && x.n >= 12;
  console.log('Demo alerts:');

  // 1. Geofence, critical, escalated by the operator, with a demo zone on the vessel's path.
  let v = take(moving);
  if (v) {
    const track = await trackOf(v.mmsi);
    const p = underwayAt(track, 0.6);
    const d = 0.012;
    const { insertId: zoneId } = await query(
      `INSERT INTO restricted_areas (name, type, geom)
       VALUES ('Demo: Naval exercise area R-12', 'military',
               ST_GeogFromText(?)) RETURNING id`,
      [`POLYGON((${p.lon} ${p.lat - d}, ${p.lon + d * 1.6} ${p.lat - d}, ${p.lon + d * 1.6} ${p.lat + d}, ${p.lon} ${p.lat + d}, ${p.lon} ${p.lat - d}))`]
    );
    const before = track.filter((x) => x.time_utc < p.time_utc).slice(-2)[0] || p;
    const vessel = vesselLabel(v.ship_name, v.mmsi);
    await insertAlert({
      type: 'geofence', severity: 'critical', status: 'escalated', assigned_to: OPERATOR,
      mmsi: v.mmsi, restricted_area_id: zoneId, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: geofenceTitle({ vessel, zone: 'Naval exercise area R-12', sog: p.sog }),
      description: `Unauthorized entry detected in restricted area "Naval exercise area R-12" (Type: military). Coordinates: [${p.lat}, ${p.lon}].`,
      events: [
        { at: before.time_utc, kind: 'observation', text: `Last position outside the zone, ${kn(before.sog) ? `at ${kn(before.sog)}` : ''} (${hhmm(before.time_utc)}).` },
        { at: p.time_utc, kind: 'raised', text: `Entered Naval exercise area R-12 ${motion(p.sog, p.cog)}.` },
        { at: later(p.time_utc, 3), kind: 'status', actor: OPERATOR, text: 'marked it acknowledged', data: { from: 'open', to: 'acknowledged' } },
        { at: later(p.time_utc, 3), kind: 'assign', actor: OPERATOR, text: 'took ownership', data: { from: null, to: OPERATOR } },
        { at: later(p.time_utc, 4), kind: 'observation', text: 'VHF channel 16 call made; no reply from the vessel.' },
        { at: later(p.time_utc, 9), kind: 'escalate', actor: OPERATOR, text: 'escalated it to intercept: no reply on VHF, patrol boat 7 nearest', data: { from: 'acknowledged', note: 'no reply on VHF, patrol boat 7 nearest' } },
      ],
    });
  }

  // 2. Dark vessel, critical, needs an owner: a vessel that really went quiet while underway.
  const [dark] = await query(
    `SELECT s.mmsi, s.ship_name, s.lat, s.lon, s.sog, s.cog, s.last_position_at
     FROM ships s
     JOIN sectors sc ON sc.id = ? AND ST_Intersects(sc.geom, ST_SetSRID(ST_MakePoint(s.lon, s.lat), 4326)::geography)
     WHERE s.last_position_at BETWEEN ${UTC_NOW} - interval '3 hours' AND ${UTC_NOW} - interval '30 minutes'
       AND s.sog > 3 AND s.sog < ${MAX_REAL_SOG} AND s.ship_name IS NOT NULL AND s.ship_name !~ '^[0-9 ]*$'
       AND (SELECT COUNT(*) FROM ais_positions p WHERE p.mmsi = s.mmsi
            AND p.time_utc BETWEEN s.last_position_at - interval '1 hour' AND s.last_position_at) >= 8
     ORDER BY random() LIMIT 1`,
    [sectorId]
  );
  if (dark) {
    used.add(String(dark.mmsi));
    const silent = Math.round((Date.now() - new Date(dark.last_position_at).getTime()) / MIN);
    await insertAlert({
      type: 'dark_vessel', severity: 'critical', status: 'open',
      mmsi: dark.mmsi, lat: dark.lat, lon: dark.lon, at: later(dark.last_position_at, 30),
      title: darkVesselTitle({ vessel: vesselLabel(dark.ship_name, dark.mmsi), sog: dark.sog }),
      description: `AIS transmissions stopped. Coordinates: [${dark.lat}, ${dark.lon}].`,
      events: [
        { at: dark.last_position_at, kind: 'raised', text: `Last AIS transmission, ${motion(dark.sog, dark.cog)}.` },
        { at: later(dark.last_position_at, 12), kind: 'observation', text: 'Expected report interval exceeded four times.' },
        { at: later(dark.last_position_at, 30), kind: 'observation', text: `No transmission for ${silent} min; nearest patrol asset 18 nm away.` },
      ],
    });
  }

  // 3. Speed anomaly, high, in review (assigned to the admin): detected at the vessel's top speed.
  v = vessels.filter((x) => !used.has(String(x.mmsi)) && x.max_sog > 14).sort((a, b) => b.max_sog - a.max_sog)[0];
  if (v) {
    used.add(String(v.mmsi));
    const track = await trackOf(v.mmsi);
    const real = track.filter((x) => Number(x.sog) < MAX_REAL_SOG);
    const p = real.reduce((best, x) => (Number(x.sog) > Number(best.sog) ? x : best), real[0]);
    const p99 = Math.max(6, Number(v.avg_sog) * 0.7).toFixed(1);
    await insertAlert({
      type: 'speed', severity: 'high', status: 'open', assigned_to: ADMIN,
      mmsi: v.mmsi, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: anomalyTitle('speed', { vessel: vesselLabel(v.ship_name, v.mmsi), sog: p.sog, p99 }),
      description: `Automated speed anomaly detected by analytic-service. Coordinates: [${p.lat}, ${p.lon}].`,
      events: [
        { at: p.time_utc, kind: 'raised', text: `Analytic-service flagged speed anomaly, ${motion(p.sog, p.cog)}; similar vessels stay under ${p99} kn.` },
        { at: later(p.time_utc, 6), kind: 'assign', actor: OPERATOR, text: 'assigned it to System Admin', data: { from: null, to: ADMIN } },
      ],
    });
  }

  // 4. Loitering, medium, needs an owner: a vessel holding position.
  v = take((x) => x.max_sog < 0.8 && x.n >= 12);
  if (v) {
    const track = await trackOf(v.mmsi);
    const p = pointAt(track, 0.8);
    const held = Math.round((new Date(p.time_utc) - new Date(track[0].time_utc)) / MIN);
    await insertAlert({
      type: 'loitering', severity: 'medium', status: 'open',
      mmsi: v.mmsi, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: anomalyTitle('loitering', { vessel: vesselLabel(v.ship_name, v.mmsi), sog: p.sog }),
      description: `Loitering detected by analytic-service. Coordinates: [${p.lat}, ${p.lon}].`,
      events: [
        { at: track[0].time_utc, kind: 'observation', text: 'Speed dropped below 0.5 kn.' },
        { at: p.time_utc, kind: 'raised', text: `Analytic-service flagged loitering: held within 200 m for ${held} min.` },
      ],
    });
  }

  // 5. Route deviation, medium, acknowledged.
  v = take(moving);
  if (v) {
    const track = await trackOf(v.mmsi);
    const p = underwayAt(track, 0.5);
    await insertAlert({
      type: 'route_deviation', severity: 'medium', status: 'acknowledged', assigned_to: OPERATOR,
      mmsi: v.mmsi, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: anomalyTitle('route', { vessel: vesselLabel(v.ship_name, v.mmsi) }),
      description: `Route deviation detected by analytic-service. Coordinates: [${p.lat}, ${p.lon}].`,
      events: [
        { at: p.time_utc, kind: 'raised', text: `Analytic-service flagged route deviation, ${motion(p.sog, p.cog)}; course differs 40° from the usual lane.` },
        { at: later(p.time_utc, 5), kind: 'status', actor: OPERATOR, text: 'marked it acknowledged', data: { from: 'open', to: 'acknowledged' } },
        { at: later(p.time_utc, 5), kind: 'assign', actor: OPERATOR, text: 'took ownership', data: { from: null, to: OPERATOR } },
      ],
    });
  }

  // 6. Collision risk, high, needs an owner.
  v = take(moving);
  const other = take(moving);
  if (v && other) {
    const track = await trackOf(v.mmsi);
    const p = underwayAt(track, 0.7);
    const vessel = vesselLabel(v.ship_name, v.mmsi);
    await insertAlert({
      type: 'collision_risk', severity: 'high', status: 'open',
      mmsi: v.mmsi, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: `${vessel} on a close-quarters course with ${vesselLabel(other.ship_name, other.mmsi)}`,
      description: `Closest point of approach 0.2 nm in 6 min. Coordinates: [${p.lat}, ${p.lon}].`,
      events: [
        { at: p.time_utc, kind: 'raised', text: `Closest point of approach 0.2 nm in 6 min, ${motion(p.sog, p.cog)}.` },
      ],
    });
  }

  // 7-8. Another speed alert and a manual report, for a fuller queue.
  v = take(moving);
  if (v) {
    const track = await trackOf(v.mmsi);
    const p = underwayAt(track, 0.4);
    await insertAlert({
      type: 'speed', severity: 'medium', status: 'open',
      mmsi: v.mmsi, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: anomalyTitle('speed', { vessel: vesselLabel(v.ship_name, v.mmsi), sog: p.sog, p99: Math.max(4, Number(p.sog) * 0.8).toFixed(1) }),
      description: `Automated speed anomaly detected by analytic-service. Coordinates: [${p.lat}, ${p.lon}].`,
      events: [{ at: p.time_utc, kind: 'raised', text: `Analytic-service flagged speed anomaly, ${motion(p.sog, p.cog)}.` }],
    });
  }
  v = take((x) => x.n >= 10);
  if (v) {
    const track = await trackOf(v.mmsi);
    const p = pointAt(track, 0.9);
    const vessel = vesselLabel(v.ship_name, v.mmsi);
    await insertAlert({
      type: 'manual', severity: 'low', status: 'open',
      mmsi: v.mmsi, lat: p.lat, lon: p.lon, at: p.time_utc,
      title: `${vessel} reported by harbour patrol: deck cargo not matching manifest`,
      description: `Manual report from harbour patrol. Coordinates: [${p.lat}, ${p.lon}].`,
      events: [{ at: p.time_utc, kind: 'raised', actor: OPERATOR, text: 'reported it: harbour patrol saw deck cargo not matching the declared manifest.' }],
    });
  }

  console.log('Done. Open the Alerts page; run with --clear to remove the demo set.');
}

try {
  if (process.argv.includes('--clear')) await clear();
  else await seed();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool?.end?.();
}
