-- Postgres: seed the only grantable permissions.
-- Run after schema + base seed (roles/users) are loaded.

BEGIN;

-- Delete assignments and permissions not in the allowed list
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

-- Upsert allowed permissions
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

-- Assign all permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Assign minimal defaults to operator role (optional)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.name IN ('dashboard.view', 'alert.view', 'reports.view')
WHERE r.name = 'operator'
ON CONFLICT DO NOTHING;

COMMIT;