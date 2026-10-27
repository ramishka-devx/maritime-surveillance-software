// What the Alerts page's case file needs.
//
// - alerts.lat/lon: where the vessel was when the alert was raised.
// - status 'escalated' (Escalate to intercept).
// - alert_events: one row per thing that happened to an alert, from the detector (raised,
//   observations) and from operators (status, assign, escalate, with from -> to in data).
// - ships.imo/callsign/destination from AIS static data (ingest-service now stores them).
// - The operator role gets alert.status.view so operators can triage (acknowledge, assign,
//   dismiss, escalate); until now only admins could.
// Backfills existing geofence alert positions (from "Coordinates: [lat, lon]" in their text)
// and one 'raised' event per existing alert.
export class AlertCaseFile1793123728070 {
  name = 'AlertCaseFile1793123728070';

  async up(queryRunner) {
    await queryRunner.query(`
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION NULL;

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS chk_alerts_status;
ALTER TABLE alerts ADD CONSTRAINT chk_alerts_status
  CHECK (status IN ('open', 'acknowledged', 'escalated', 'resolved', 'dismissed'));

CREATE TABLE IF NOT EXISTS alert_events (
  id       BIGSERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL,
  at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind     VARCHAR(20) NOT NULL,
  text     TEXT NOT NULL,
  actor_id INTEGER NULL,
  data     JSONB NULL,
  CONSTRAINT alert_events_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES alerts(alert_id) ON DELETE CASCADE,
  CONSTRAINT alert_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_alert_events_kind CHECK (kind IN ('raised', 'observation', 'status', 'assign', 'escalate'))
);
CREATE INDEX IF NOT EXISTS idx_alert_events_alert_at ON alert_events (alert_id, at);

ALTER TABLE ships
  ADD COLUMN IF NOT EXISTS imo VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS callsign VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS destination TEXT NULL;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'operator' AND p.name = 'alert.status.view'
ON CONFLICT DO NOTHING;

UPDATE alerts a
SET lat = m.c[1]::double precision, lon = m.c[2]::double precision
FROM (
  SELECT alert_id, regexp_match(description, 'Coordinates: \\[(-?[0-9.]+), (-?[0-9.]+)\\]') AS c
  FROM alerts
  WHERE lat IS NULL AND description IS NOT NULL
) m
WHERE a.alert_id = m.alert_id AND m.c IS NOT NULL;

INSERT INTO alert_events (alert_id, at, kind, text)
SELECT a.alert_id, a.created_at, 'raised', COALESCE(a.description, a.title)
FROM alerts a
WHERE NOT EXISTS (SELECT 1 FROM alert_events e WHERE e.alert_id = a.alert_id);
`);
  }

  async down(queryRunner) {
    // Escalated alerts fall back to acknowledged; the operator keeps alert.status.view only if
    // it was granted some other way, so revoke it here.
    await queryRunner.query(`
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id
  AND r.name = 'operator' AND p.name = 'alert.status.view';

ALTER TABLE ships
  DROP COLUMN IF EXISTS destination,
  DROP COLUMN IF EXISTS callsign,
  DROP COLUMN IF EXISTS imo;

DROP TABLE IF EXISTS alert_events;

UPDATE alerts SET status = 'acknowledged' WHERE status = 'escalated';
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS chk_alerts_status;
ALTER TABLE alerts ADD CONSTRAINT chk_alerts_status
  CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed'));

ALTER TABLE alerts
  DROP COLUMN IF EXISTS lon,
  DROP COLUMN IF EXISTS lat;
`);
  }
}
