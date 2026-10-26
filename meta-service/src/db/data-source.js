// TypeORM DataSource used only by the migration CLI (npm run db:migrate etc.).
// The app itself still queries through src/config/db.config.js.
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import * as entities from './entities/index.js';

export default new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  entities: Object.values(entities),
  migrations: ['src/db/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false
});
