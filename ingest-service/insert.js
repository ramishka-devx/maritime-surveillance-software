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

function resolveShipType(data, existingShip) {
  if (data.ship_type !== null && data.ship_type !== undefined) return data.ship_type;
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

  if (width === null || length === null || ship.shipType === null || ship.shipType === undefined) {
    return false;
  }

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
      ship.shipType
    ]
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
