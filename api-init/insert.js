const pool = require("./db");

async function insertAIS(data) {
  const sql = `
    INSERT INTO ais_positions
    (mmsi, ship_name, sog, cog, heading, nav_status,
     position, time_utc, raw_data)
    VALUES (
      $1, $2, $3, $4, $5, $6,
      ST_MakePoint($7, $8)::geography,
      $9,
      $10
    )
  `;

  const values = [
    data.mmsi,
    data.ship_name,
    data.sog,
    data.cog,
    data.heading,
    data.nav_status,
    data.lon,
    data.lat,
    data.time,
    data.raw
  ];

  try {
    await pool.query(sql, values);
  } catch (err) {
    console.error("[DB] Error inserting AIS data for MMSI", data.mmsi, ":", err.message);
    throw err;
  }
}

async function insertAISBatch(dataArray) {
  if (!dataArray || dataArray.length === 0) {
    return { inserted: 0, failed: 0 };
  }

  let inserted = 0;
  let failed = 0;

  for (const data of dataArray) {
    try {
      await insertAIS(data);
      inserted++;
    } catch (err) {
      failed++;
    }
  }

  return { inserted, failed };
}

module.exports = {
  insertAIS,
  insertAISBatch
};
