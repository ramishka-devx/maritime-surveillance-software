-- Add structured details to activity logs
-- Stores safe, minimal metadata about what was touched (e.g. requested permission, alert_id)

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS details JSONB NULL;
