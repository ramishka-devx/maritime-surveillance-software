/**
 * RBAC Implementation Examples with Real API Permissions
 * 
 * This file shows practical examples of implementing RBAC in your components
 * using the permissions returned from the login API
 */

import { usePermission } from '../auth/usePermission.js';
import { PermissionGate, HideFromPermission } from '../auth/PermissionGate.jsx';
import { withPermission } from '../auth/withPermission.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

// =============================================================================
// EXAMPLE 1: Users Management Module
// =============================================================================

export function UsersManagement() {
  const { can, canAny } = usePermission();

  return (
    <div className="p-6">
      <h1>User Management</h1>

      {/* List Users - requires users.list permission */}
      <PermissionGate permission="users.list">
        <button className="btn btn-primary">View All Users</button>
      </PermissionGate>

      {/* Create User - requires users.create permission */}
      <PermissionGate 
        permission="users.create"
        fallback={<p className="text-gray-500">No permission to create users</p>}
      >
        <section className="mt-4 p-4 border">
          <h2>Create New User</h2>
          <form>
            <input type="text" placeholder="Username" />
            <input type="email" placeholder="Email" />
            <button type="submit">Create User</button>
          </form>
        </section>
      </PermissionGate>

      {/* Edit User - requires users.update permission */}
      <PermissionGate permission="users.update">
        <section className="mt-4 p-4 border">
          <h2>Edit User</h2>
          <button>Edit</button>
        </section>
      </PermissionGate>

      {/* Delete User - requires users.delete permission (usually admin only) */}
      <PermissionGate 
        permission="users.delete"
        fallback={<p className="text-red-500 text-sm">Delete access restricted</p>}
      >
        <button className="btn btn-danger">Delete User</button>
      </PermissionGate>

      {/* Suspend/Verify Users - for admin functions */}
      <PermissionGate 
        permissions={['users.suspend', 'users.verify']} 
        fallback={null}
      >
        <section className="mt-4">
          <h3>Admin Actions</h3>
          {can('users.suspend') && <button>Suspend User</button>}
          {can('users.verify') && <button>Verify User</button>}
        </section>
      </PermissionGate>

      {/* View User Activity - requires users.activity.view */}
      <PermissionGate permission="users.activity.view">
        <section className="mt-4">
          <h2>User Activity Log</h2>
          <p>Activity history would display here</p>
        </section>
      </PermissionGate>

      {/* User Roles & Permissions Management */}
      <PermissionGate permissions={['users.roles.assign', 'users.permissions.assign']}>
        <section className="mt-4 p-4 border border-yellow-400 bg-yellow-50">
          <h2>User Access Control</h2>
          {can('users.roles.assign') && (
            <button>Assign Roles to User</button>
          )}
          {can('users.permissions.assign') && (
            <button>Assign Permissions to User</button>
          )}
        </section>
      </PermissionGate>
    </div>
  );
}

// =============================================================================
// EXAMPLE 2: Vessels Management Module
// =============================================================================

export function VesselsManagement() {
  const { can, getModulePermissions } = usePermission();

  // Get all permissions for the vessels module
  const vesselPermissions = getModulePermissions('vessels');
  const hasVesselAccess = vesselPermissions.length > 0;

  if (!hasVesselAccess) {
    return <div className="p-6 text-red-600">No access to Vessels module</div>;
  }

  return (
    <div className="p-6">
      <h1>Vessel Management</h1>
      <p className="text-sm text-gray-600">
        You have {vesselPermissions.length} permission(s) for this module
      </p>

      {/* View Vessels List */}
      <PermissionGate permission="vessels.list">
        <section className="mt-4">
          <h2>All Vessels</h2>
          <table>
            <thead>
              <tr>
                <th>MMSI</th>
                <th>Name</th>
                <th>Status</th>
                {can('vessels.update') && <th>Actions</th>}
                {can('vessels.delete') && <th>Delete</th>}
              </tr>
            </thead>
            <tbody>
              {/* Vessel rows */}
            </tbody>
          </table>
        </section>
      </PermissionGate>

      {/* Create Vessel */}
      <PermissionGate permission="vessels.create">
        <section className="mt-4 p-4 border">
          <h2>Add New Vessel</h2>
          <form>
            <input type="text" placeholder="Vessel Name" />
            <input type="number" placeholder="MMSI" />
            <button type="submit">Create Vessel</button>
          </form>
        </section>
      </PermissionGate>

      {/* View Positions */}
      <PermissionGate permission="vessels.positions.view">
        <section className="mt-4">
          <h2>Vessel Positions</h2>
          <p>Real-time vessel positions would display here</p>
        </section>
      </PermissionGate>

      {/* Create Position Tracking */}
      <PermissionGate permission="vessels.positions.create">
        <button>Create Position Entry</button>
      </PermissionGate>

      {/* View History */}
      <PermissionGate permission="vessels.history.view">
        <section className="mt-4">
          <h2>Vessel History</h2>
          <p>Historical vessel data would display here</p>
        </section>
      </PermissionGate>
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: Alerts & Notifications
// =============================================================================

export function AlertsPanel() {
  const { can, canAny } = usePermission();

  return (
    <div className="p-6">
      <h1>Alerts & Notifications</h1>

      {/* View Alerts */}
      <PermissionGate permission="alerts.list">
        <section>
          <h2>Active Alerts</h2>
          {/* Alerts list */}
        </section>
      </PermissionGate>

      {/* Alert Actions - Acknowledge, Resolve, Dismiss */}
      <PermissionGate permissions={['alerts.acknowledge', 'alerts.resolve', 'alerts.dismiss']}>
        <section className="mt-4 p-4 bg-blue-50 border border-blue-200">
          <h3>Alert Actions</h3>
          <div className="flex gap-2">
            {can('alerts.acknowledge') && (
              <button className="btn btn-sm">Acknowledge</button>
            )}
            {can('alerts.resolve') && (
              <button className="btn btn-sm">Resolve Alert</button>
            )}
            {can('alerts.dismiss') && (
              <button className="btn btn-sm">Dismiss</button>
            )}
            {can('alerts.create') && (
              <button className="btn btn-sm">Create Alert</button>
            )}
          </div>
        </section>
      </PermissionGate>

      {/* Alert Assignment - admin function */}
      <PermissionGate permission="alerts.assign">
        <button className="mt-2">Assign Alert to User</button>
      </PermissionGate>

      {/* Notifications */}
      <PermissionGate permission="notifications.view">
        <section className="mt-4">
          <h2>Notifications</h2>
          {/* Notifications list */}
        </section>
      </PermissionGate>

      {/* Delete Notifications - usually admin only */}
      <PermissionGate permission="notifications.delete">
        <button className="btn btn-danger btn-sm">Clear Notifications</button>
      </PermissionGate>
    </div>
  );
}

// =============================================================================
// EXAMPLE 4: Admin Panel - Roles & Permissions
// =============================================================================

export function AdminPanel() {
  const { isSuperAdmin } = usePermission();

  return (
    <div className="p-6">
      <h1>Admin Panel</h1>

      {/* Roles Management */}
      <PermissionGate permissions={['roles.list', 'roles.create', 'roles.update']}>
        <section className="mt-4 p-4 border">
          <h2>Role Management</h2>
          
          <PermissionGate permission="roles.list">
            <div className="mb-4">
              <h3>All Roles</h3>
              {/* Roles list */}
            </div>
          </PermissionGate>

          <PermissionGate permission="roles.create">
            <button className="btn btn-sm">Create New Role</button>
          </PermissionGate>
        </section>
      </PermissionGate>

      {/* Permissions Management */}
      <PermissionGate permissions={['permissions.list', 'permissions.create']}>
        <section className="mt-4 p-4 border border-purple-200">
          <h2>Permissions Management</h2>
          
          <PermissionGate permission="permissions.list">
            <div className="mb-4">
              <h3>All Permissions</h3>
              {/* Permissions list */}
            </div>
          </PermissionGate>

          <PermissionGate permission="permissions.create">
            <button className="btn btn-sm">Create Permission</button>
          </PermissionGate>
        </section>
      </PermissionGate>

      {/* System Settings - Super Admin Only */}
      <PermissionGate superAdminOnly>
        <section className="mt-4 p-4 border border-red-200 bg-red-50">
          <h2>System Settings</h2>
          <p>Only Super Admin can access this</p>
          {isSuperAdmin() && (
            <button className="btn btn-warning">System Configuration</button>
          )}
        </section>
      </PermissionGate>
    </div>
  );
}

// =============================================================================
// EXAMPLE 5: Dashboard with Module-Based Access
// =============================================================================

export function Dashboard() {
  const { can, canAccessModule, getModulePermissions } = usePermission();
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1>Welcome, {user?.first_name || 'User'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {/* Dashboard - Map View */}
        <PermissionGate permission="dashboard.map.view">
          <div className="p-4 border rounded bg-blue-50">
            <h3>Map View</h3>
            <p>Real-time vessel positions on map</p>
          </div>
        </PermissionGate>

        {/* Dashboard - Active Alerts */}
        <PermissionGate permission="dashboard.active_alerts.view">
          <div className="p-4 border rounded bg-red-50">
            <h3>Active Alerts</h3>
            <p>Current system alerts</p>
          </div>
        </PermissionGate>

        {/* Analytics */}
        <PermissionGate permission="analytics.dashboard.view">
          <div className="p-4 border rounded bg-green-50">
            <h3>Analytics</h3>
            <p>System analytics and reports</p>
          </div>
        </PermissionGate>

        {/* Activities Log */}
        <PermissionGate permission="activities.logs.view">
          <div className="p-4 border rounded bg-yellow-50">
            <h3>Activity Log</h3>
            <p>System activity history</p>
          </div>
        </PermissionGate>

        {/* AIS Data */}
        <PermissionGate permission="ais.view">
          <div className="p-4 border rounded bg-indigo-50">
            <h3>AIS Data</h3>
            <p>Automatic Identification System data</p>
          </div>
        </PermissionGate>

        {/* Module Summary */}
        <div className="p-4 border rounded bg-gray-50">
          <h3>Your Module Access</h3>
          <ul className="text-sm">
            {canAccessModule('users') && <li>✓ Users Module</li>}
            {canAccessModule('vessels') && <li>✓ Vessels Module</li>}
            {canAccessModule('alerts') && <li>✓ Alerts Module</li>}
            {canAccessModule('roles') && <li>✓ Roles Module</li>}
            {canAccessModule('permissions') && <li>✓ Permissions Module</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 6: Using HOC for Custom Components
// =============================================================================

// Custom component
function ActionButton({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="btn">
      {icon} {label}
    </button>
  );
}

// Wrap it with permission check
const ProtectedActionButton = withPermission(ActionButton);

export function ActionButtonExample() {
  return (
    <div className="p-6 space-y-4">
      {/* Create User Button */}
      <ProtectedActionButton
        requiredPermission="users.create"
        label="Create User"
        icon="➕"
        onClick={() => console.log('Create user clicked')}
      />

      {/* Delete Vessel Button */}
      <ProtectedActionButton
        requiredPermission="vessels.delete"
        label="Delete Vessel"
        icon="🗑️"
        onClick={() => console.log('Delete vessel clicked')}
        fallback={<span className="text-gray-400">Delete not available</span>}
      />

      {/* Admin Only Button */}
      <ProtectedActionButton
        superAdminOnly
        label="System Settings"
        icon="⚙️"
        onClick={() => console.log('System settings')}
        fallback={<span className="text-red-500">Admin access required</span>}
      />
    </div>
  );
}

// =============================================================================
// EXAMPLE 7: Navigation with RBAC
// =============================================================================

export function Navigation() {
  const { can, canAccessModule } = usePermission();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex gap-4">
        <li>
          <a href="/">Home</a>
        </li>

        {/* Users Menu - Show if user has any users permission */}
        <PermissionGate permission="users.list">
          <li>
            <a href="/users">Users</a>
          </li>
        </PermissionGate>

        {/* Vessels Menu */}
        <PermissionGate permission="vessels.list">
          <li>
            <a href="/vessels">Vessels</a>
          </li>
        </PermissionGate>

        {/* Alerts Menu */}
        <PermissionGate permission="alerts.list">
          <li>
            <a href="/alerts">Alerts</a>
          </li>
        </PermissionGate>

        {/* Reports Menu */}
        <PermissionGate permission="reports.view">
          <li>
            <a href="/reports">Reports</a>
          </li>
        </PermissionGate>

        {/* Admin Menu - Super Admin Only */}
        <HideFromPermission permission="roles.list">
          <li className="ml-auto">
            <a href="/login">Login</a>
          </li>
        </HideFromPermission>

        {/* Admin Dropdown */}
        <PermissionGate 
          permissions={['roles.list', 'permissions.list', 'users.list']}
          fallback={null}
        >
          <li className="ml-auto">
            <details>
              <summary>Admin</summary>
              <ul className="absolute bg-gray-700 mt-2 rounded">
                <li>
                  <PermissionGate permission="roles.list">
                    <a href="/admin/roles">Roles</a>
                  </PermissionGate>
                </li>
                <li>
                  <PermissionGate permission="permissions.list">
                    <a href="/admin/permissions">Permissions</a>
                  </PermissionGate>
                </li>
              </ul>
            </details>
          </li>
        </PermissionGate>
      </ul>
    </nav>
  );
}

// =============================================================================
// EXAMPLE 8: Form with Conditional Fields
// =============================================================================

export function UserEditForm({ userId }) {
  const { can, canAll } = usePermission();

  return (
    <form className="p-6 border rounded max-w-md">
      <h2>Edit User</h2>

      {/* Basic fields - editable if user has update permission */}
      <PermissionGate permission="users.update">
        <div className="mb-4">
          <label>Email</label>
          <input type="email" />
        </div>

        <div className="mb-4">
          <label>Name</label>
          <input type="text" />
        </div>
      </PermissionGate>

      {/* Sensitive fields - only for users with full permissions */}
      <PermissionGate 
        permissions={['users.update', 'users.verify']}
        requireAll
      >
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200">
          <label>
            <input type="checkbox" /> Verify User
          </label>
        </div>
      </PermissionGate>

      {/* Admin only fields */}
      <PermissionGate permission="users.delete">
        <div className="mb-4 p-3 bg-red-50 border border-red-200">
          <label>
            <input type="checkbox" /> Mark for Deletion
          </label>
        </div>
      </PermissionGate>

      {/* Submit button */}
      <PermissionGate permission="users.update">
        <button type="submit" className="btn btn-primary w-full">
          Save Changes
        </button>
      </PermissionGate>
    </form>
  );
}

export default {
  UsersManagement,
  VesselsManagement,
  AlertsPanel,
  AdminPanel,
  Dashboard,
  Navigation,
  UserEditForm,
};
