import { query } from './src/config/db.config.js';

async function checkMeta() {
  try {
    const rows = await query("SELECT column_name, column_default, data_type FROM information_schema.columns WHERE table_name = 'restricted_areas'");
    console.log(rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkMeta();
