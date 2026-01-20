-- Maritime Surveillance seed data

-- Roles
INSERT INTO roles (role_id, name)
VALUES
	(1, 'super_admin'),
	(2, 'operator')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Users
-- Passwords (dev only):
-- super_admin: Admin123!
-- operator: Operator123!
INSERT INTO users (user_id, first_name, last_name, username, email, password_hash, role_id, status)
VALUES
	(1, 'Super', 'Admin', 'admin', 'admin@seranguard.local', '$2b$10$yR7bMcnL4WyS9gpf6jbftO52vwUTEfCnaYqwlKzwPhhpOnWOTtyWm', 1, 'verified'),
	(2, 'Ops', 'Operator', 'operator', 'operator@seranguard.local', '$2b$10$QkGq8adQcoVRKMfLnvfG0OFk39BPyZ98yaoZrrvZ6BjlQqLF3DIgi', 2, 'verified')
ON DUPLICATE KEY UPDATE
	first_name = VALUES(first_name),
	last_name = VALUES(last_name),
	username = VALUES(username),
	password_hash = VALUES(password_hash),
	role_id = VALUES(role_id),
	status = VALUES(status);

-- Vessels
INSERT INTO vessels (vessel_id, mmsi, imo, name, callsign, flag, vessel_type, length_m, width_m)
VALUES
	(1, '123456789', 'IMO1234567', 'SERAN GUARD', 'SG001', 'Unknown', 'Patrol', 35.50, 7.20)
ON DUPLICATE KEY UPDATE
	name = VALUES(name),
	callsign = VALUES(callsign),
	flag = VALUES(flag),
	vessel_type = VALUES(vessel_type),
	length_m = VALUES(length_m),
	width_m = VALUES(width_m);

-- Positions (sample)
INSERT INTO vessel_positions (vessel_id, recorded_at, lat, lon, sog_kn, cog_deg, heading_deg, nav_status, source)
VALUES
	(1, UTC_TIMESTAMP(), 6.524379, 3.379206, 12.4, 86.2, 85, 'Under way using engine', 'ais');

-- Alerts (sample)
INSERT INTO alerts (vessel_id, type, severity, status, title, description, created_by, assigned_to)
VALUES
	(1, 'manual', 'medium', 'open', 'Test alert', 'Sample alert for maritime surveillance', 1, 2);
