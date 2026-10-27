export class RestrictedAreaLifecycle1793126400000 {
  name = 'RestrictedAreaLifecycle1793126400000';

  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE restricted_areas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
      ALTER TABLE restricted_areas ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;
      ALTER TABLE restricted_areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      CREATE INDEX IF NOT EXISTS idx_restricted_areas_active_geom
        ON restricted_areas USING GIST (geom) WHERE status = 'active';
      CREATE INDEX IF NOT EXISTS idx_restricted_areas_expires_at
        ON restricted_areas (expires_at) WHERE expires_at IS NOT NULL;
      CREATE TABLE IF NOT EXISTS geofence_vessel_state (
        mmsi BIGINT NOT NULL,
        restricted_area_id INTEGER NOT NULL REFERENCES restricted_areas(id) ON DELETE CASCADE,
        is_inside BOOLEAN NOT NULL DEFAULT TRUE,
        entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (mmsi, restricted_area_id)
      );
      CREATE INDEX IF NOT EXISTS idx_geofence_vessel_state_inside
        ON geofence_vessel_state (mmsi) WHERE is_inside = TRUE;
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS geofence_vessel_state; DROP INDEX IF EXISTS idx_restricted_areas_active_geom; DROP INDEX IF EXISTS idx_restricted_areas_expires_at; ALTER TABLE restricted_areas DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS expires_at, DROP COLUMN IF EXISTS updated_at;`);
  }
}
