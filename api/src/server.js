import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import cron from 'node-cron';
import { sendDailyMaintenanceNotifications } from './cron/maintenanceNotifications.js';

const server = app.listen(env.port, () => {
  logger.info(`Server running on http://localhost:${env.port}`);
});

// Schedule daily maintenance notifications every 10 seconds (for testing)
const interval = '* 6 * * *';
// const interval = '*/10 * * * * *';

cron.schedule(interval, () => {
  logger.info('Running scheduled maintenance notification check...');
  sendDailyMaintenanceNotifications();
}, {
  timezone: 'UTC' // Adjust timezone as needed
});

function shutdown() {
  logger.info('Shutting down...');
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
