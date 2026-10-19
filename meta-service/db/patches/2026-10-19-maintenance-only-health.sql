BEGIN;

DELETE FROM role_permissions
WHERE role_id IN (SELECT role_id FROM roles WHERE LOWER(TRIM(name)) = 'maintenance');

-- Primary Maintenance accounts must not retain legacy Super Admin assignments
-- or direct permission grants that contradict their assigned role.
DELETE FROM user_permissions
WHERE user_id IN (
  SELECT u.user_id FROM users u JOIN roles r ON r.role_id = u.role_id
  WHERE LOWER(TRIM(r.name)) = 'maintenance'
);

DELETE FROM user_roles
WHERE user_id IN (
  SELECT u.user_id FROM users u JOIN roles r ON r.role_id = u.role_id
  WHERE LOWER(TRIM(r.name)) = 'maintenance'
) AND role_id NOT IN (SELECT role_id FROM roles WHERE LOWER(TRIM(name)) = 'maintenance');

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, u.role_id FROM users u JOIN roles r ON r.role_id = u.role_id
WHERE LOWER(TRIM(r.name)) = 'maintenance'
ON CONFLICT DO NOTHING;

COMMIT;
