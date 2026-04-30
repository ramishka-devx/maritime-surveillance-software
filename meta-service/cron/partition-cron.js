import cron from 'node-cron';
import { pool } from '../src/config/db.config.js';

// Run every midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running partition creation job:', new Date());

  let client;
  try {
    client = await pool.connect();

    await client.query('SELECT create_next_two_partitions();');

    console.log('Partitions created successfully');
  } catch (err) {
    console.error('Partition creation failed:', err);
  } finally {
    if (client) client.release();
  }
});