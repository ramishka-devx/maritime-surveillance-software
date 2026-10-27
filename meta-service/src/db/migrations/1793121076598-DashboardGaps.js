// Data the dashboard summary needs.
//
// - alerts.mmsi links an alert to the AIS vessel (ships). Until now alerts only had
//   vessel_id -> vessels, which automated alerts rarely have, so they showed "Unknown vessel".
//   Backfilled from vessels.mmsi, then from the MMSI the detectors write into titles.
// - alerts.restricted_area_id records which zone a geofence alert is about (incursions per
//   zone, and exact dedup in the geofence cron instead of LIKE on the text). Backfilled from
//   the "... in <zone>" title suffix.
// - alert types 'loitering' and 'route_deviation', so anomalies stop being filed as 'speed'.
// - anomaly_type_enum gains 'loitering' for the loitering detector. Enum values can't be
//   dropped, so down() leaves it in place.
// - sectors: named areas of interest for the dashboard, seeded where the data is.
export class DashboardGaps1793121076598 {
  name = 'DashboardGaps1793121076598';

  async up(queryRunner) {
    await queryRunner.query(`
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS mmsi BIGINT NULL,
  ADD COLUMN IF NOT EXISTS restricted_area_id INTEGER NULL;

ALTER TABLE alerts
  ADD CONSTRAINT alerts_mmsi_fkey FOREIGN KEY (mmsi) REFERENCES ships(mmsi) ON DELETE SET NULL,
  ADD CONSTRAINT alerts_restricted_area_id_fkey
    FOREIGN KEY (restricted_area_id) REFERENCES restricted_areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_mmsi ON alerts (mmsi);

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS chk_alerts_type;
ALTER TABLE alerts ADD CONSTRAINT chk_alerts_type CHECK (type IN (
  'geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual', 'loitering', 'route_deviation'
));

UPDATE alerts a
SET mmsi = v.mmsi::bigint
FROM vessels v
WHERE a.vessel_id = v.vessel_id
  AND a.mmsi IS NULL
  AND v.mmsi ~ '^[0-9]+$'
  AND EXISTS (SELECT 1 FROM ships s WHERE s.mmsi = v.mmsi::bigint);

-- Detector titles read "... NAME (123456789) ..." or "... MMSI 123456789 ...".
UPDATE alerts a
SET mmsi = m.mmsi
FROM (
  SELECT alert_id, (regexp_match(title, '(?:\\(|MMSI )([0-9]{9})'))[1]::bigint AS mmsi
  FROM alerts
  WHERE mmsi IS NULL
) m
WHERE a.alert_id = m.alert_id
  AND m.mmsi IS NOT NULL
  AND EXISTS (SELECT 1 FROM ships s WHERE s.mmsi = m.mmsi);

UPDATE alerts a
SET restricted_area_id = r.id
FROM restricted_areas r
WHERE a.type = 'geofence'
  AND a.restricted_area_id IS NULL
  AND r.name IS NOT NULL
  AND right(a.title, length(r.name) + 4) = ' in ' || r.name;

ALTER TYPE anomaly_type_enum ADD VALUE IF NOT EXISTS 'loitering';

CREATE TABLE IF NOT EXISTS sectors (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  geom       GEOGRAPHY(Polygon, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sectors_name_key UNIQUE (name)
);
CREATE INDEX IF NOT EXISTS idx_sectors_geom ON sectors USING GIST (geom);

INSERT INTO sectors (name, geom) VALUES
  ('Sri Lanka waters', ST_GeogFromText('POLYGON((78.5 5, 82.5 5, 82.5 10.5, 78.5 10.5, 78.5 5))')),
  ('Netherlands & North Sea approaches', ST_GeogFromText('POLYGON((2.5 51, 7 51, 7 54, 2.5 54, 2.5 51))'))
ON CONFLICT (name) DO NOTHING;
`);
  }

  async down(queryRunner) {
    // Loitering / route-deviation alerts fall back to 'speed', which is what they were filed
    // as before this migration. 'loitering' stays in anomaly_type_enum (Postgres can't drop it).
    await queryRunner.query(`
DROP TABLE IF EXISTS sectors;

UPDATE alerts SET type = 'speed' WHERE type IN ('loitering', 'route_deviation');
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS chk_alerts_type;
ALTER TABLE alerts ADD CONSTRAINT chk_alerts_type CHECK (type IN (
  'geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual'
));

DROP INDEX IF EXISTS idx_alerts_mmsi;
DROP INDEX IF EXISTS idx_alerts_created_at;
ALTER TABLE alerts
  DROP CONSTRAINT IF EXISTS alerts_restricted_area_id_fkey,
  DROP CONSTRAINT IF EXISTS alerts_mmsi_fkey,
  DROP COLUMN IF EXISTS restricted_area_id,
  DROP COLUMN IF EXISTS mmsi;
`);
  }
}
