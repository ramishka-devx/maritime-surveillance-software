-- Maritime Surveillance DB schema
-- MySQL/MariaDB

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS vessel_positions;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS vessels;

DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS notifications;

DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  role_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (role_id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  permission_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (permission_id),
  UNIQUE KEY uq_permissions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_rp_permission (permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('pending', 'verified', 'disabled') NOT NULL DEFAULT 'pending',
  profileImg VARCHAR(2048) NOT NULL DEFAULT 'https://res.cloudinary.com/dftbkrs4f/image/upload/v1732101562/avatar2_d0vokh.png',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vessels (
  vessel_id INT NOT NULL AUTO_INCREMENT,
  mmsi VARCHAR(9) NOT NULL,
  imo VARCHAR(10) NULL,
  name VARCHAR(120) NULL,
  callsign VARCHAR(20) NULL,
  flag VARCHAR(60) NULL,
  vessel_type VARCHAR(60) NULL,
  length_m DECIMAL(6,2) NULL,
  width_m DECIMAL(6,2) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (vessel_id),
  UNIQUE KEY uq_vessels_mmsi (mmsi),
  KEY idx_vessels_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vessel_positions (
  position_id BIGINT NOT NULL AUTO_INCREMENT,
  vessel_id INT NOT NULL,
  recorded_at DATETIME NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lon DECIMAL(9,6) NOT NULL,
  sog_kn DECIMAL(6,2) NULL,
  cog_deg DECIMAL(6,2) NULL,
  heading_deg SMALLINT NULL,
  nav_status VARCHAR(50) NULL,
  source ENUM('ais', 'radar', 'manual', 'fused') NOT NULL DEFAULT 'ais',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (position_id),
  KEY idx_positions_vessel_time (vessel_id, recorded_at),
  CONSTRAINT fk_positions_vessel FOREIGN KEY (vessel_id) REFERENCES vessels(vessel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alerts (
  alert_id INT NOT NULL AUTO_INCREMENT,
  vessel_id INT NULL,
  type ENUM('geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual') NOT NULL DEFAULT 'manual',
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'acknowledged', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_by INT NOT NULL,
  assigned_to INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (alert_id),
  KEY idx_alerts_status (status),
  KEY idx_alerts_severity (severity),
  KEY idx_alerts_vessel (vessel_id),
  CONSTRAINT fk_alerts_vessel FOREIGN KEY (vessel_id) REFERENCES vessels(vessel_id) ON DELETE SET NULL,
  CONSTRAINT fk_alerts_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
  CONSTRAINT fk_alerts_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activities (
  activity_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  permission_id INT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id),
  KEY idx_activities_user (user_id),
  KEY idx_activities_permission (permission_id),
  KEY idx_activities_created_at (created_at),
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  notification_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  priority ENUM('low','medium','high','critical') DEFAULT 'medium',
  is_read TINYINT(1) DEFAULT 0,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  KEY idx_notifications_user (user_id, is_read, created_at),
  KEY idx_notifications_type (type),
  KEY idx_notifications_entity (entity_type, entity_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
