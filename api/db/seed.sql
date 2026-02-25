-- Maritime Surveillance seed data

-- Roles
INSERT INTO roles (role_id, name, description, is_system, is_active)
VALUES
	(1, 'super_admin', 'Super administrator (bypass permission checks)', 1, 1),
	(2, 'operator', 'Operator', 1, 1)
ON CONFLICT (role_id) DO UPDATE
SET name = EXCLUDED.name,
		description = EXCLUDED.description,
		is_system = EXCLUDED.is_system,
		is_active = EXCLUDED.is_active;

-- Default super admin user
-- Password hash is bcrypt (change via API if needed).
INSERT INTO users (user_id, first_name, last_name, username, email, password_hash, role_id, status, profile_img)
VALUES
	(1, 'System', 'Admin', 'admin', 'admin@example.com', '$2b$10$E80oo.o6cPsgYrSJ46g3uuvWtRlgWPTTpmVfSRy8izo6U9KcCyJq2', 1, 'verified', 'https://res.cloudinary.com/dftbkrs4f/image/upload/v1732101562/avatar2_d0vokh.png')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
		username = EXCLUDED.username,
		first_name = EXCLUDED.first_name,
		last_name = EXCLUDED.last_name,
		role_id = EXCLUDED.role_id,
		status = EXCLUDED.status,
		profile_img = EXCLUDED.profile_img;

-- Sample operator user (so assigned_to references are valid)
INSERT INTO users (user_id, first_name, last_name, username, email, password_hash, role_id, status, profile_img)
VALUES
	(2, 'Default', 'Operator', 'operator', 'operator@example.com', '$2b$10$E80oo.o6cPsgYrSJ46g3uuvWtRlgWPTTpmVfSRy8izo6U9KcCyJq2', 2, 'verified', 'https://res.cloudinary.com/dftbkrs4f/image/upload/v1732101562/avatar2_d0vokh.png')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
		username = EXCLUDED.username,
		first_name = EXCLUDED.first_name,
		last_name = EXCLUDED.last_name,
		role_id = EXCLUDED.role_id,
		status = EXCLUDED.status,
		profile_img = EXCLUDED.profile_img;

-- Ensure multi-role table has the primary role
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
VALUES (2, 2)
ON CONFLICT DO NOTHING;

-- Keep identity sequences in sync after explicit inserts
SELECT setval(pg_get_serial_sequence('roles', 'role_id'), (SELECT COALESCE(MAX(role_id), 1) FROM roles), true);
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users), true);
INSERT INTO vessels (vessel_id, mmsi, imo, name, callsign, flag, vessel_type, length_m, width_m)
VALUES
	(1, '123456789', 'IMO1234567', 'SERAN GUARD', 'SG001', 'Unknown', 'Patrol', 35.50, 7.20)
ON CONFLICT (vessel_id) DO UPDATE
SET mmsi = EXCLUDED.mmsi,
		imo = EXCLUDED.imo,
		name = EXCLUDED.name,
		callsign = EXCLUDED.callsign,
		flag = EXCLUDED.flag,
		vessel_type = EXCLUDED.vessel_type,
		length_m = EXCLUDED.length_m,
		width_m = EXCLUDED.width_m;

SELECT setval(pg_get_serial_sequence('vessels', 'vessel_id'), (SELECT COALESCE(MAX(vessel_id), 1) FROM vessels), true);

-- Positions (sample)
INSERT INTO vessel_positions (vessel_id, recorded_at, lat, lon, sog_kn, cog_deg, heading_deg, nav_status, source)
VALUES
	(1, NOW(), 6.524379, 3.379206, 12.4, 86.2, 85, 'Under way using engine', 'ais');

-- Alerts (sample)
INSERT INTO alerts (vessel_id, type, severity, status, title, description, created_by, assigned_to)
VALUES
	(1, 'manual', 'medium', 'open', 'Test alert', 'Sample alert for maritime surveillance', 1, 2);
