-- AIS ingestion schema (ships / ship_types / partitioned ais_positions).
--
-- This must be applied BEFORE meta-service/db/schema.sql, because `anomalies`
-- in schema.sql has a foreign key onto ships(mmsi).
--
-- The table shape here is reconstructed from the code that reads/writes it
-- (ingest-service/insert.js, meta-service src/modules/ais + restricted-areas,
-- ingest-service/queries/loitering.sql), not from the original hand-made DB.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS ship_types (
    ship_type_id SMALLINT PRIMARY KEY,
    description  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ships (
    mmsi       BIGINT PRIMARY KEY,
    ship_name  TEXT,
    ship_type  SMALLINT REFERENCES ship_types(ship_type_id),
    dimensions JSONB,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ais_positions (
    id         BIGSERIAL,
    mmsi       BIGINT NOT NULL REFERENCES ships(mmsi),
    ship_name  TEXT,                        -- read by loitering.sql and detectEntries, left NULL by ingest
    sog        REAL,
    cog        REAL,
    heading    REAL,
    nav_status SMALLINT,
    lon        DOUBLE PRECISION,
    lat        DOUBLE PRECISION,
    position   GEOGRAPHY(Point, 4326),
    time_utc   TIMESTAMP NOT NULL,
    width      REAL,
    length     REAL,
    ship_type  SMALLINT NOT NULL REFERENCES ship_types(ship_type_id),
    PRIMARY KEY (id, time_utc)
)
PARTITION BY RANGE (time_utc);

CREATE INDEX IF NOT EXISTS idx_ais_positions_mmsi_time ON ais_positions (mmsi, time_utc DESC);
CREATE INDEX IF NOT EXISTS idx_ais_positions_position  ON ais_positions USING GIST (position);

-- Safety-net partition so inserts never fail if the nightly job has not run.
CREATE TABLE IF NOT EXISTS ais_positions_default PARTITION OF ais_positions DEFAULT;

-- Called nightly by meta-service/cron/partition-cron.js. Creates the next two
-- daily partitions of ais_positions. Idempotent; tolerates rows already present
-- in the DEFAULT partition (skips that day with a NOTICE).
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

SELECT create_next_two_partitions();
