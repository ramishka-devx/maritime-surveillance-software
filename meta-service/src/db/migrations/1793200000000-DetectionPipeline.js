// What the SRS §3.4 detection pipeline needs.
//
// - anomalies.score / model_version: the IsolationForest anomaly score (0-1, ~0.5 normal) and
//   which fitted model produced it. anomalies.lat: latitude got stuffed into details.lat because
//   the table only had lon; moved into the column here.
// - alerts.confidence_score: the anomaly score copied onto the alert (REQ-F-045).
// - detection_settings: admin-editable detector settings (REQ-F-047), key -> JSON value,
//   seeded with the defaults analytic-service used to read from env.
// - speed_thresholds: p99 SOG per vessel-type group. analytic-service reports p99_computed after
//   each refit; an admin may set p99_override. Groups are AIS type codes: exact codes for the
//   mixed 30-39 / 50-59 ranges, tens otherwise, 0 for unknown.
export class DetectionPipeline1793200000000 {
  name = 'DetectionPipeline1793200000000';

  async up(queryRunner) {
    await queryRunner.query(`
ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS score NUMERIC(4,3) NULL,
  ADD COLUMN IF NOT EXISTS model_version TEXT NULL;

UPDATE anomalies
SET lat = (details->>'lat')::double precision, details = details - 'lat'
WHERE lat IS NULL AND jsonb_typeof(details->'lat') = 'number';

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4,3) NULL;

CREATE TABLE IF NOT EXISTS detection_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  INTEGER NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT detection_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

INSERT INTO detection_settings (key, value) VALUES
  ('speed.score_threshold', '0.7'),
  ('speed.warning_threshold', '0.65'),
  ('speed.high_severity_score', '0.75'),
  ('speed.min_group_samples', '200'),
  ('speed.fallback_p99_kn', 'null'),
  ('speed.refit_minutes', '15'),
  ('alerts.cooldown_minutes', '30'),
  ('loitering.radius_m', '1000'),
  ('loitering.min_minutes', '60'),
  ('loitering.max_sog_kn', '2'),
  ('loitering.cooldown_minutes', '180')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS speed_thresholds (
  type_group    SMALLINT PRIMARY KEY,
  label         TEXT NOT NULL,
  p99_computed  REAL NULL,
  sample_count  INTEGER NOT NULL DEFAULT 0,
  computed_at   TIMESTAMPTZ NULL,
  p99_override  REAL NULL,
  updated_by    INTEGER NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT speed_thresholds_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_speed_thresholds_override CHECK (p99_override IS NULL OR (p99_override > 0 AND p99_override <= 100))
);

INSERT INTO speed_thresholds (type_group, label) VALUES
  (0, 'Unknown / unclassified'),
  (20, 'Wing in ground'),
  (30, 'Fishing'),
  (31, 'Towing'),
  (32, 'Towing (large)'),
  (33, 'Dredging / underwater ops'),
  (34, 'Diving ops'),
  (35, 'Military ops'),
  (36, 'Sailing'),
  (37, 'Pleasure craft'),
  (40, 'High-speed craft'),
  (50, 'Pilot vessel'),
  (51, 'Search and rescue'),
  (52, 'Tug'),
  (53, 'Port tender'),
  (54, 'Anti-pollution'),
  (55, 'Law enforcement'),
  (58, 'Medical transport'),
  (60, 'Passenger'),
  (70, 'Cargo'),
  (80, 'Tanker'),
  (90, 'Other')
ON CONFLICT (type_group) DO NOTHING;
`);
  }

  async down(queryRunner) {
    await queryRunner.query(`
DROP TABLE IF EXISTS speed_thresholds;
DROP TABLE IF EXISTS detection_settings;

ALTER TABLE alerts DROP COLUMN IF EXISTS confidence_score;

UPDATE anomalies
SET details = COALESCE(details, '{}'::jsonb) || jsonb_build_object('lat', lat)
WHERE lat IS NOT NULL;

ALTER TABLE anomalies
  DROP COLUMN IF EXISTS model_version,
  DROP COLUMN IF EXISTS score,
  DROP COLUMN IF EXISTS lat;
`);
  }
}
