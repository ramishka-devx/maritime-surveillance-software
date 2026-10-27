const pool = require("./db");

function defaultDimensions() {
  return {};
}

async function ensureShipType(client, shipTypeId) {
  if (shipTypeId === null || shipTypeId === undefined) {
    return;
  }

  await client.query(
    `INSERT INTO ship_types (ship_type_id, description)
     VALUES ($1, $2)
     ON CONFLICT (ship_type_id) DO NOTHING`,
    [shipTypeId, shipTypeId === 0 ? "Unknown" : `AIS ship type ${shipTypeId}`]
  );
}

async function getExistingShip(client, mmsi) {
  const result = await client.query(
    `SELECT mmsi, ship_name, ship_type, dimensions
     FROM ships
     WHERE mmsi = $1
     LIMIT 1`,
    [mmsi]
  );

  return result.rows[0] || null;
}

function mergeDimensions(existingDimensions, incomingDimensions) {
  return incomingDimensions || existingDimensions || defaultDimensions();
}

// AIS "type of ship and cargo" codes are 0-99 (ship_types is seeded with exactly those);
// transponders sometimes send garbage, which is stored as NULL.
function isValidShipType(code) {
  return Number.isInteger(code) && code >= 0 && code <= 99;
}

function resolveShipType(data, existingShip) {
  if (data.ship_type !== null && data.ship_type !== undefined) {
    return isValidShipType(data.ship_type) ? data.ship_type : null;
  }
  if (existingShip?.ship_type !== null && existingShip?.ship_type !== undefined) return existingShip.ship_type;
  return 0;
}

function resolveDimensionMeasure(primary, dimensions, keys) {
  if (primary !== null && primary !== undefined) return primary;
  if (!dimensions) return null;

  const values = keys.map((key) => Number(dimensions[key]) || 0);
  if (values.every((value) => value === 0)) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

async function upsertShip(client, data) {
  const existingShip = await getExistingShip(client, data.mmsi);
  const shipType = resolveShipType(data, existingShip);
  const dimensions = mergeDimensions(existingShip?.dimensions, data.dimensions);

  await ensureShipType(client, shipType);

  await client.query(
    `INSERT INTO ships (mmsi, ship_name, ship_type, dimensions, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (mmsi)
     DO UPDATE SET
       ship_name = COALESCE(EXCLUDED.ship_name, ships.ship_name),
       ship_type = COALESCE(EXCLUDED.ship_type, ships.ship_type),
       dimensions = COALESCE(EXCLUDED.dimensions, ships.dimensions),
       updated_at = NOW()`,
    [data.mmsi, data.ship_name, shipType, dimensions ? JSON.stringify(dimensions) : null]
  );

  return {
    shipType,
    dimensions
  };
}

async function insertPosition(client, data, ship) {
  if (data.message_type !== "PositionReport") {
    return false;
  }

  if (data.lat === null || data.lon === null || !data.time) {
    return false;
  }

  const width = resolveDimensionMeasure(data.width, ship.dimensions, ["c", "d"]);
  const length = resolveDimensionMeasure(data.length, ship.dimensions, ["a", "b"]);

  // Dimensions are optional in AIS reports; do not drop a usable position (and its
  // geofence check) just because a static-data message has not arrived yet.
  const positionShipType = ship.shipType ?? 0;
  await ensureShipType(client, positionShipType);

  await client.query(
    `INSERT INTO ais_positions (
       mmsi, sog, cog, heading, nav_status,
       lon, lat, position, time_utc, width, length, ship_type
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9, $10, $11
     )`,
    [
      data.mmsi,
      data.sog,
      data.cog,
      data.heading,
      data.nav_status,
      data.lon,
      data.lat,
      data.time,
      width,
      length,
      positionShipType
    ]
  );

  // Keep one inside/outside row per vessel and zone. Only the outside -> inside
  // transition creates an alert, so repeated AIS reports do not flood operators.
  await client.query(
    `UPDATE geofence_vessel_state state
     SET is_inside = FALSE, last_seen_at = $4
     WHERE state.mmsi = $1 AND state.is_inside = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM restricted_areas area
         WHERE area.id = state.restricted_area_id
           AND area.status = 'active'
           AND (area.expires_at IS NULL OR area.expires_at > $4)
           AND ST_Intersects(area.geom, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography)
       )`,
    [data.mmsi, data.lon, data.lat, data.time]
  );

  const entries = await client.query(
    `WITH intersecting AS (
       SELECT id, name, type FROM restricted_areas
       WHERE status = 'active' AND (expires_at IS NULL OR expires_at > $4)
         AND ST_Intersects(geom, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography)
     ), entered AS (
       INSERT INTO geofence_vessel_state (mmsi, restricted_area_id, is_inside, entered_at, last_seen_at)
       SELECT $1, id, TRUE, $4, $4 FROM intersecting
       ON CONFLICT (mmsi, restricted_area_id) DO UPDATE
         SET is_inside = TRUE, entered_at = EXCLUDED.entered_at, last_seen_at = EXCLUDED.last_seen_at
         WHERE geofence_vessel_state.is_inside = FALSE
       RETURNING restricted_area_id
     ), alerts_created AS (
       INSERT INTO alerts (vessel_id, type, severity, status, title, description, created_by, created_at, updated_at)
       SELECT v.vessel_id, 'geofence', 'critical', 'open',
              'Zone Breach: ' || COALESCE(s.ship_name, v.name, $1::text) || ' entered ' || COALESCE(i.name, 'Restricted Area #' || i.id::text),
              'Vessel ' || $1::text || ' entered restricted area ' || COALESCE(i.name, 'Restricted Area #' || i.id::text) || ' (' || COALESCE(i.type, 'restricted') || '). [zone:' || i.id::text || ']',
              (SELECT user_id FROM users ORDER BY user_id LIMIT 1), NOW(), NOW()
       FROM entered e JOIN intersecting i ON i.id = e.restricted_area_id
       LEFT JOIN vessels v ON v.mmsi = $1::text
       LEFT JOIN ships s ON s.mmsi = $1
       WHERE EXISTS (SELECT 1 FROM users)
       RETURNING alert_id, vessel_id, title, description, created_at
     )
     SELECT a.alert_id, a.vessel_id, a.title, a.created_at,
            i.id AS restricted_area_id, i.name AS restricted_zone, i.type AS restricted_area_type,
            $1::text AS mmsi, $3::float8 AS lat, $2::float8 AS lon
     FROM alerts_created a
     JOIN intersecting i ON a.description LIKE '%[zone:' || i.id::text || ']%'
     JOIN entered e ON e.restricted_area_id = i.id`,
    [data.mmsi, data.lon, data.lat, data.time]
  );

  for (const event of entries.rows) {
    await client.query('SELECT pg_notify($1, $2)', ['geofence_incursion', JSON.stringify(event)]);
  }

  // Denormalised latest position, read by meta-service's map endpoint. The guard keeps an
  // out-of-order (older) report from overwriting a newer one.
  await client.query(
    `UPDATE ships
     SET lat = $2, lon = $3, sog = $4, cog = $5, heading = $6, nav_status = $7,
         last_position_at = $8
     WHERE mmsi = $1 AND (last_position_at IS NULL OR last_position_at < $8)`,
    [data.mmsi, data.lat, data.lon, data.sog, data.cog, data.heading, data.nav_status, data.time]
  );

  return true;
}

async function processAISMessage(data) {
  if (!data?.mmsi) {
    return { shipUpserted: 0, positionsInserted: 0 };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const ship = await upsertShip(client, data);
    const insertedPosition = await insertPosition(client, data, ship);
    await client.query("COMMIT");

    return {
      shipUpserted: 1,
      positionsInserted: insertedPosition ? 1 : 0
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] Error persisting AIS data for MMSI", data.mmsi, ":", err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  processAISMessage
};
