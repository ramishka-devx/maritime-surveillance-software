import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  permissionsBypass: process.env.PERMISSIONS_BYPASS === 'true',
  cronEnabled: process.env.CRON_ENABLED !== 'false',
  admin: {
    // If set, allows creating a super_admin via public /api/users/register by providing this secret.
    // Leave empty to disable super_admin self-registration.
    registrationSecret: process.env.SUPER_ADMIN_REGISTRATION_SECRET || '',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ais_db',
    failFast: process.env.DB_FAIL_FAST
      ? process.env.DB_FAIL_FAST === 'true'
      : process.env.NODE_ENV === 'production',
    connectRetries: Number(process.env.DB_CONNECT_RETRIES || 10),
    connectRetryDelayMs: Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 2000),
    connectTimeoutMs: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000),
    poolMax: Number(process.env.DB_POOL_MAX || 20),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@machinecure.com',
  },
  // Dark-vessel detector (src/cron/darkVesselDetector.js): vessels in a sector that were
  // underway (> minSog kn, >= minReports positions in their last hour) then silent for
  // silenceMin minutes; at most one alert per vessel per rearmHours.
  darkVessel: {
    silenceMin: Number(process.env.DARK_SILENCE_MIN || 30),
    minSog: Number(process.env.DARK_MIN_SOG || 3),
    minReports: Number(process.env.DARK_MIN_REPORTS || 10),
    rearmHours: Number(process.env.DARK_REARM_HOURS || 6),
  },
  sts: {
    positionWindowMinutes: Number(process.env.STS_POSITION_WINDOW_MIN || 5),
    proximityMeters: Number(process.env.STS_PROXIMITY_M || 500),
    separationMeters: Number(process.env.STS_SEPARATION_M || 1000),
    slowSpeedKnots: Number(process.env.STS_SLOW_SPEED_KN || 3),
    minimumDurationMinutes: Number(process.env.STS_MIN_DURATION_MIN || 30),
    rearmHours: Number(process.env.STS_REARM_HOURS || 12),
  }
};
