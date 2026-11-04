export class StsEncounters1793200000000 {
  name = 'StsEncounters1793200000000';

  async up(queryRunner) {
    await queryRunner.query(`
ALTER TABLE ships
  ADD COLUMN IF NOT EXISTS position GEOGRAPHY(Point, 4326),
  ADD COLUMN IF NOT EXISTS draught REAL;

UPDATE ships
SET position = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
WHERE position IS NULL AND lon IS NOT NULL AND lat IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ships_position_gist ON ships USING GIST (position);

CREATE TABLE IF NOT EXISTS sts_encounters (
  encounter_id BIGSERIAL PRIMARY KEY,
  mmsi_a BIGINT NOT NULL REFERENCES ships(mmsi) ON DELETE CASCADE,
  mmsi_b BIGINT NOT NULL REFERENCES ships(mmsi) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  last_seen_together_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NULL,
  min_distance_m DOUBLE PRECISION NOT NULL,
  centroid_lat DOUBLE PRECISION NOT NULL,
  centroid_lon DOUBLE PRECISION NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  alerted BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT chk_sts_pair_order CHECK (mmsi_a < mmsi_b),
  CONSTRAINT chk_sts_status CHECK (status IN ('active', 'probable', 'ended')),
  CONSTRAINT sts_encounters_pair_active_key UNIQUE (mmsi_a, mmsi_b, started_at)
);
CREATE INDEX IF NOT EXISTS idx_sts_encounters_active ON sts_encounters(status, last_seen_together_at);
CREATE INDEX IF NOT EXISTS idx_sts_encounters_mmsi ON sts_encounters(mmsi_a, mmsi_b, started_at DESC);

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sts_encounter_id BIGINT NULL;
ALTER TABLE alerts
  ADD CONSTRAINT alerts_sts_encounter_id_fkey
  FOREIGN KEY (sts_encounter_id) REFERENCES sts_encounters(encounter_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_sts_encounter ON alerts(sts_encounter_id);

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS chk_alerts_type;
ALTER TABLE alerts ADD CONSTRAINT chk_alerts_type CHECK (type IN (
  'geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual',
  'loitering', 'route_deviation', 'sts_transfer'
));

ALTER TYPE anomaly_type_enum ADD VALUE IF NOT EXISTS 'sts_transfer';
`);
  }

  async down(queryRunner) {
    await queryRunner.query(`
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_sts_encounter_id_fkey;
DROP INDEX IF EXISTS idx_alerts_sts_encounter;
ALTER TABLE alerts DROP COLUMN IF EXISTS sts_encounter_id;
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS chk_alerts_type;
ALTER TABLE alerts ADD CONSTRAINT chk_alerts_type CHECK (type IN (
  'geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual',
  'loitering', 'route_deviation'
));
DROP TABLE IF EXISTS sts_encounters;
DROP INDEX IF EXISTS idx_ships_position_gist;
ALTER TABLE ships DROP COLUMN IF EXISTS position;
ALTER TABLE ships DROP COLUMN IF EXISTS draught;
`);
  }
}
