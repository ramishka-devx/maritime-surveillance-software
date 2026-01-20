-- Patch: Add per-user permission overrides
-- Run with: node scripts/run-sql.js db/patches/2026-01-21-add-user-permissions.sql

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  KEY idx_up_permission (permission_id),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_up_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
