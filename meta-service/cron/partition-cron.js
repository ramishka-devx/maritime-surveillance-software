import cron from 'node-cron';
import { pool } from '../src/config/db.config.js';

const AIS_RETENTION_DAYS = 7;

// Creates today's + the next two daily ais_positions partitions and drops ones older than
// AIS_RETENTION_DAYS (both functions live in the AisReadPath migration).
async function maintainPartitions() {
  try {
    await pool.query('SELECT create_next_two_partitions()');
    await pool.query('SELECT drop_old_ais_partitions($1)', [AIS_RETENTION_DAYS]);
    console.log('Partition maintenance done:', new Date());
  } catch (err) {
    console.error('Partition maintenance failed:', err);
  }
}

// On startup too, so partitions exist even if the server wasn't up at midnight.
maintainPartitions();
cron.schedule('0 0 * * *', maintainPartitions);
