import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startDbConnectionCheck } from './config/db.config.js';
import cron from 'node-cron';
import { sendDailyMaintenanceNotifications } from './cron/maintenanceNotifications.js';

(async () => {
  try {
    if (env.db.failFast) {
      await startDbConnectionCheck();
    } else {
      startDbConnectionCheck();
    }
  } catch (err) {
    logger.fatal({ err }, 'Database initialization failed (fail-fast enabled).');
    process.exit(1);
  }

  const preferredPort = Number(env.port);
  let port = Number.isFinite(preferredPort) ? preferredPort : 3000;
  const maxPortAttempts = env.nodeEnv === 'production' ? 1 : 10;

  let server;
  for (let attempt = 1; attempt <= maxPortAttempts; attempt++) {
    try {
      server = await new Promise((resolve, reject) => {
        const s = app.listen(port, () => resolve(s));
        s.once('error', reject);
      });

      logger.info(`Server running on http://localhost:${port}`);
      break;
    } catch (err) {
      if (err?.code === 'EADDRINUSE' && attempt < maxPortAttempts) {
        logger.warn(
          { port, attempt, maxPortAttempts },
          `Port ${port} is in use. Trying ${port + 1}...`
        );
        port++;
        continue;
      }

      logger.fatal({ err, port }, 'Server failed to start.');
      process.exit(1);
    }
  }

  // Schedule daily maintenance notifications
  const interval = '* 6 * * *';
  // const interval = '*/10 * * * * *';

  cron.schedule(
    interval,
    () => {
      logger.info('Running scheduled maintenance notification check...');
      sendDailyMaintenanceNotifications();
    },
    {
      timezone: 'UTC',
    }
  );

  function shutdown() {
    logger.info('Shutting down...');
    server.close(() => process.exit(0));
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
