# Database Scripts

This folder contains scripts for setting up and managing the database.

## Available Scripts

### `run-sql.js`
A utility script to execute SQL files against the database.
```bash
node scripts/run-sql.js <sql-file-path>
```

### `seed-permissions.js`
Seeds all system permissions into the database and assigns them to roles.

**What it does:**
- Inserts all 88 permissions defined in the system
- Assigns all permissions to the 'admin' role
- Assigns basic read permissions to the 'user' role

**Usage:**
```bash
npm run db:seed-permissions
```

**Prerequisites:**
- Database schema must be created (`npm run db:schema`)
- Initial seed data must be loaded (`npm run db:seed`) to create roles

### `seed-permissions.sql`
SQL-only version of the permission seeding script. Can be run with:
```bash
node scripts/run-sql.js scripts/seed-permissions.sql
```

## Permission Categories

The system includes permissions for:
- **Users**: CRUD operations and role management
- **Permissions & Roles**: System administration
- **Divisions & Types**: Organizational structure
- **Machines, Meters, Parameters**: Equipment management
- **Breakdowns**: Issue tracking and repair management
- **Notifications**: User notifications
- **Dashboard**: Analytics and overview
- **Maintenance**: Scheduled maintenance
- **Kaizen**: Continuous improvement suggestions

## Role Assignments

- **Admin**: All permissions
- **User**: Basic read permissions for common operations