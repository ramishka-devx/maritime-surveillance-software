import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  permissionsBypass: process.env.PERMISSIONS_BYPASS === 'true',
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
  }
};
