import { query } from './src/config/db.config.js';

async function checkTable() {
  try {
    const tableInfo = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'restricted_areas'
    `);
    console.log('Table exists:', tableInfo.length > 0);

    if (tableInfo.length > 0) {
      const rows = await query('SELECT id, name, type FROM restricted_areas LIMIT 5');
      console.log('Table content (first 5 rows):', JSON.stringify(rows, null, 2));
      
      const count = await query('SELECT COUNT(*) FROM restricted_areas');
      console.log('Total restricted areas:', count[0].count);
    } else {
      console.log('Creating table restricted_areas...');
      await query(`
        CREATE TABLE IF NOT EXISTS restricted_areas (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          geom GEOGRAPHY(Polygon, 4326) NOT NULL
        )
      `);
      console.log('Table created.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkTable();
