import { query } from './src/config/db.config.js';

async function checkGeometry() {
  try {
    const rows = await query('SELECT ST_AsGeoJSON(geom::geometry) AS geometry FROM restricted_areas LIMIT 1');
    if (rows.length > 0) {
      console.log('Geometry raw type:', typeof rows[0].geometry);
      console.log('Geometry raw value:', rows[0].geometry);
    } else {
      console.log('No rows found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkGeometry();
