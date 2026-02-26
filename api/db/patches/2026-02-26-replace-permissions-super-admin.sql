-- Replace existing permission vocabulary with the current, grantable set.
-- Date: 2026-02-26
-- Notes:
-- - This is Postgres SQL.
-- - It deletes any permissions not in the allowed list (and their assignments).
-- - It then upserts the allowed permissions and assigns them to super_admin.

BEGIN;

-- Allowed permissions (the only ones super admins can grant)
-- dashboard.view
-- alert.view
-- alert.status.view
-- reports.view
-- report.download
-- users.list
-- users.view
-- user.status.update

-- Remove assignments tied to permissions outside the allowed list
DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT permission_id
  FROM permissions
  WHERE name NOT IN (
    'dashboard.view',
    'alert.view',
    'alert.status.view',
    'reports.view',
    'report.download',
    'users.list',
    'users.view',
    'user.status.update'
  )
);

DELETE FROM user_permissions
WHERE permission_id IN (
  SELECT permission_id
  FROM permissions
  WHERE name NOT IN (
    'dashboard.view',
    'alert.view',
    'alert.status.view',
    'reports.view',
    'report.download',
    'users.list',
    'users.view',
    'user.status.update'
  )
);

-- Delete permissions outside the allowed list
DELETE FROM permissions
WHERE name NOT IN (
  'dashboard.view',
  'alert.view',
  'alert.status.view',
  'reports.view',
  'report.download',
  'users.list',
  'users.view',
  'user.status.update'
);

-- Upsert the allowed permissions
INSERT INTO permissions (name, module, is_active)
VALUES
  ('dashboard.view', 'dashboard', 1),
  ('alert.view', 'alert', 1),
  ('alert.status.view', 'alert', 1),
  ('reports.view', 'reports', 1),
  ('report.download', 'report', 1),
  ('users.list', 'users', 1),
  ('users.view', 'users', 1),
  ('user.status.update', 'user', 1)
ON CONFLICT (name) DO UPDATE
SET module = EXCLUDED.module,
    is_active = 1;

-- Assign all allowed permissions to super_admin (role name based)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

COMMIT;
