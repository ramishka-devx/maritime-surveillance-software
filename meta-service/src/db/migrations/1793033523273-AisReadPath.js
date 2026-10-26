// Map read path + ais_positions housekeeping.
//
// - ships carries each vessel's latest position (written by ingest-service alongside the
//   ais_positions insert), so /api/ais/positions/latest reads one row per vessel instead of
//   DISTINCT ON over the whole position history.
// - idx_ais_positions_time serves the geofence cron's MAX(time_utc) and time-window scans.
// - create_next_two_partitions() now also creates today's partition, and
//   drop_old_ais_partitions(keep_days) implements retention (called by partition-cron.js).
export class AisReadPath1793033523273 {
  name = 'AisReadPath1793033523273';

  async up(queryRunner) {
    await queryRunner.query(`
ALTER TABLE ships
  ADD COLUMN IF NOT EXISTS lat              DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lon              DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS sog              REAL,
  ADD COLUMN IF NOT EXISTS cog              REAL,
  ADD COLUMN IF NOT EXISTS heading          REAL,
  ADD COLUMN IF NOT EXISTS nav_status       SMALLINT,
  ADD COLUMN IF NOT EXISTS last_position_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ships_last_position_at ON ships (last_position_at DESC);

UPDATE ships s
SET lat = l.lat, lon = l.lon, sog = l.sog, cog = l.cog, heading = l.heading,
    nav_status = l.nav_status, last_position_at = l.time_utc
FROM (
  SELECT DISTINCT ON (mmsi) mmsi, lat, lon, sog, cog, heading, nav_status, time_utc
  FROM ais_positions
  ORDER BY mmsi, time_utc DESC
) l
WHERE s.mmsi = l.mmsi AND s.last_position_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ais_positions_time ON ais_positions (time_utc);

-- Same as InitialSchema's version, but starts at today (i = 0) so the current day gets a
-- real partition even if the nightly job didn't run at midnight.
CREATE OR REPLACE FUNCTION create_next_two_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d         date;
  part_name text;
BEGIN
  FOR i IN 0..2 LOOP
    d := current_date + i;
    part_name := format('ais_positions_%s', to_char(d, 'YYYYMMDD'));
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name) THEN
      BEGIN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF ais_positions FOR VALUES FROM (%L) TO (%L)',
          part_name, d::timestamp, (d + 1)::timestamp
        );
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'create_next_two_partitions: skipped % (%)', part_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

-- Drops daily partitions whose day is before current_date - keep_days, and trims rows that
-- landed in the DEFAULT partition. Nothing references ais_positions (anomalies reference
-- ships), so dropping is safe.
CREATE OR REPLACE FUNCTION drop_old_ais_partitions(keep_days int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff date := current_date - keep_days;
  part   record;
BEGIN
  FOR part IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    WHERE i.inhparent = 'ais_positions'::regclass
      AND c.relname ~ '^ais_positions_[0-9]{8}$'
  LOOP
    IF to_date(right(part.relname, 8), 'YYYYMMDD') < cutoff THEN
      EXECUTE format('DROP TABLE %I', part.relname);
    END IF;
  END LOOP;

  DELETE FROM ais_positions_default WHERE time_utc < cutoff;
END;
$$;

SELECT create_next_two_partitions();
`);
  }

  async down(queryRunner) {
    await queryRunner.query(`
DROP FUNCTION IF EXISTS drop_old_ais_partitions(int);

CREATE OR REPLACE FUNCTION create_next_two_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d         date;
  part_name text;
BEGIN
  FOR i IN 1..2 LOOP
    d := current_date + i;
    part_name := format('ais_positions_%s', to_char(d, 'YYYYMMDD'));
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name) THEN
      BEGIN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF ais_positions FOR VALUES FROM (%L) TO (%L)',
          part_name, d::timestamp, (d + 1)::timestamp
        );
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'create_next_two_partitions: skipped % (%)', part_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

DROP INDEX IF EXISTS idx_ais_positions_time;
DROP INDEX IF EXISTS idx_ships_last_position_at;

ALTER TABLE ships
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lon,
  DROP COLUMN IF EXISTS sog,
  DROP COLUMN IF EXISTS cog,
  DROP COLUMN IF EXISTS heading,
  DROP COLUMN IF EXISTS nav_status,
  DROP COLUMN IF EXISTS last_position_at;
`);
  }
}
