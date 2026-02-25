/**
 * RBAC Integration Guide for Existing Pages
 * 
 * Shows how to add permission checks to your existing page components
 * using the actual permissions from your login API response.
 */

// =============================================================================
// STEP 1: Import Required Functions
// =============================================================================

/**
 * In your page component, import:
 * 
 * import { usePermission } from '../auth/usePermission.js';
 * import { PermissionGate, HideFromPermission } from '../auth/PermissionGate.jsx';
 * import { withPermission } from '../auth/withPermission.jsx';
 * import { useAuth } from '../auth/AuthContext.jsx';
 */

// =============================================================================
// STEP 2: Use in Your Pages
// =============================================================================

/**
 * EXAMPLE: Protecting the Users Page (pages/Users.jsx)
 */

import { usePermission } from '../auth/usePermission.js';
import { PermissionGate } from '../auth/PermissionGate.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export function UsersPage() {
  const { user } = useAuth();
  const { can, canAny } = usePermission();

  // If user doesn't have basic users.list permission, deny access
  if (!can('users.list')) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p>You don't have permission to view users</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1>User Management</h1>
        
        {/* Create User Button - Only show if user has permission */}
        <PermissionGate permission="users.create">
          <button className="btn btn-primary" onClick={() => {/* open create modal */}}>
            + Create User
          </button>
        </PermissionGate>
      </div>

      {/* Users Table */}
      <table className="w-full border">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            {/* Show Edit column only if user can update */}
            {can('users.update') && <th>Edit</th>}
            {/* Show Delete column only if user can delete */}
            {can('users.delete') && <th>Delete</th>}
          </tr>
        </thead>
        <tbody>
          {/* Map through users and show actions based on permissions */}
          {/* Example row: */}
          <tr>
            <td>Admin</td>
            <td>admin@example.com</td>
            <td>Active</td>
            {can('users.update') && (
              <td>
                <button className="text-blue-500">Edit</button>
              </td>
            )}
            {can('users.delete') && (
              <td>
                <button className="text-red-500">Delete</button>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/* Advanced Features - Only for admins */}
      <PermissionGate 
        permissions={['users.suspend', 'users.verify']}
        fallback={null}
      >
        <section className="mt-6 p-4 bg-yellow-50 border border-yellow-200">
          <h2>Admin Actions</h2>
          <div className="flex gap-2">
            {can('users.suspend') && (
              <button className="btn btn-warning">Bulk Suspend</button>
            )}
            {can('users.verify') && (
              <button className="btn btn-info">Verify Users</button>
            )}
          </div>
        </section>
      </PermissionGate>
    </div>
  );
}

// =============================================================================
// STEP 3: Form Component with Permission-Based Fields
// =============================================================================

export function UserEditForm({ userId, onSave }) {
  const { can, canAll } = usePermission();
  const [formData, setFormData] = React.useState({});

  // If user can't update, disable form
  if (!can('users.update')) {
    return <div className="p-4 text-red-600">You don't have permission to edit users</div>;
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSave(formData);
    }} className="max-w-md">
      <div className="mb-4">
        <label>Email</label>
        <input 
          type="email" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      {/* Only show verify checkbox if user has both update AND verify permissions */}
      <PermissionGate 
        permissions={['users.update', 'users.verify']}
        requireAll
      >
        <div className="mb-4 p-3 bg-blue-50 border">
          <label>
            <input 
              type="checkbox"
              checked={formData.verified}
              onChange={(e) => setFormData({...formData, verified: e.target.checked})}
            />
            Verified
          </label>
        </div>
      </PermissionGate>

      {/* Only show delete option if user is admin or has delete permission */}
      <PermissionGate permission="users.delete">
        <div className="mb-4 p-3 bg-red-50 border border-red-300">
          <label>
            <input type="checkbox" />
            Delete this user
          </label>
        </div>
      </PermissionGate>

      <button type="submit" className="btn btn-primary">
        Save Changes
      </button>
    </form>
  );
}

// =============================================================================
// STEP 4: List Component with Conditional Columns
// =============================================================================

export function VesselsList() {
  const { can } = usePermission();
  const [vessels, setVessels] = React.useState([
    // Your vessels data
  ]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">MMSI</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Status</th>
            
            {/* Positions column - only if user can view */}
            {can('vessels.positions.view') && (
              <th className="px-4 py-2">Positions</th>
            )}
            
            {/* History column - only if user can view */}
            {can('vessels.history.view') && (
              <th className="px-4 py-2">History</th>
            )}
            
            {/* Actions column - show if user can perform any action */}
            {(can('vessels.update') || can('vessels.delete')) && (
              <th className="px-4 py-2">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {vessels.map((vessel) => (
            <tr key={vessel.mmsi} className="border-b">
              <td className="px-4 py-2">{vessel.mmsi}</td>
              <td className="px-4 py-2">{vessel.name}</td>
              <td className="px-4 py-2">{vessel.status}</td>
              
              {can('vessels.positions.view') && (
                <td className="px-4 py-2">
                  <button className="text-blue-500 text-sm">View</button>
                </td>
              )}
              
              {can('vessels.history.view') && (
                <td className="px-4 py-2">
                  <button className="text-blue-500 text-sm">View</button>
                </td>
              )}
              
              {(can('vessels.update') || can('vessels.delete')) && (
                <td className="px-4 py-2 flex gap-2">
                  {can('vessels.update') && (
                    <button className="text-blue-500 text-sm">Edit</button>
                  )}
                  {can('vessels.delete') && (
                    <button className="text-red-500 text-sm">Delete</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// STEP 5: Alerts Page with Multiple Permission Levels
// =============================================================================

export function AlertsPage() {
  const { can, canAny } = usePermission();

  // Guest access - no alerts permissions
  if (!can('alerts.list')) {
    return (
      <div className="p-6">
        <h1>Alerts</h1>
        <p className="text-gray-500">You don't have permission to view alerts</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1>Alerts Management</h1>

      {/* Alerts Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th>Alert ID</th>
              <th>Message</th>
              <th>Status</th>
              {can('alerts.update') && <th>Update</th>}
              {canAny(['alerts.acknowledge', 'alerts.resolve', 'alerts.dismiss']) && (
                <th>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Alert rows */}
          </tbody>
        </table>
      </div>

      {/* Action Panel */}
      <PermissionGate 
        permissions={['alerts.acknowledge', 'alerts.resolve', 'alerts.dismiss']}
      >
        <section className="mt-6 p-4 bg-blue-50 border border-blue-200">
          <h2>Bulk Actions</h2>
          <div className="flex gap-2">
            {can('alerts.acknowledge') && (
              <button className="btn btn-sm">Acknowledge Selected</button>
            )}
            {can('alerts.resolve') && (
              <button className="btn btn-sm">Resolve Selected</button>
            )}
            {can('alerts.dismiss') && (
              <button className="btn btn-sm">Dismiss Selected</button>
            )}
          </div>
        </section>
      </PermissionGate>

      {/* Create Alert - Admin only */}
      <PermissionGate permission="alerts.create">
        <button className="mt-4 btn btn-primary">New Alert</button>
      </PermissionGate>
    </div>
  );
}

// =============================================================================
// STEP 6: Dashboard with Module-Based Navigation
// =============================================================================

export function Dashboard() {
  const { can, canAccessModule, getModulePermissions, isSuperAdmin } = usePermission();
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1>Welcome, {user?.first_name}! 👋</h1>
      <p className="text-gray-600">Role: {user?.role_id === 1 ? 'Super Admin' : 'User'}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {/* Only show if user has map view permission */}
        {can('dashboard.map.view') && (
          <div className="p-4 border rounded hover:shadow-lg cursor-pointer">
            <h3 className="font-bold mb-2">📍 Map View</h3>
            <p className="text-sm text-gray-600">Real-time vessel positions</p>
          </div>
        )}

        {/* Only show if user has alerts permission */}
        {can('dashboard.active_alerts.view') && (
          <div className="p-4 border rounded hover:shadow-lg cursor-pointer">
            <h3 className="font-bold mb-2">🚨 Active Alerts</h3>
            <p className="text-sm text-gray-600">Current system alerts</p>
          </div>
        )}

        {/* Only show if user has analytics permission */}
        {can('analytics.dashboard.view') && (
          <div className="p-4 border rounded hover:shadow-lg cursor-pointer">
            <h3 className="font-bold mb-2">📊 Analytics</h3>
            <p className="text-sm text-gray-600">System analytics</p>
          </div>
        )}

        {/* Only show if user has activity logs permission */}
        {can('activities.logs.view') && (
          <div className="p-4 border rounded hover:shadow-lg cursor-pointer">
            <h3 className="font-bold mb-2">📝 Activity Logs</h3>
            <p className="text-sm text-gray-600">System activity history</p>
          </div>
        )}

        {/* Only show if user has AIS permission */}
        {can('ais.view') && (
          <div className="p-4 border rounded hover:shadow-lg cursor-pointer">
            <h3 className="font-bold mb-2">📡 AIS Data</h3>
            <p className="text-sm text-gray-600">AIS tracking data</p>
          </div>
        )}

        {/* Admin Panel - only for super admins or those with admin permissions */}
        {canAccessModule('roles') || canAccessModule('permissions') | isSuperAdmin() && (
          <div className="p-4 border rounded hover:shadow-lg cursor-pointer bg-red-50">
            <h3 className="font-bold mb-2">⚙️ Administration</h3>
            <p className="text-sm text-gray-600">System administration</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <section className="mt-8 p-4 bg-gray-50 border rounded">
        <h3 className="font-bold mb-4">Your Permissions</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Modules:</strong>
            <ul className="mt-2 text-gray-600">
              {canAccessModule('users') && <li>✓ Users</li>}
              {canAccessModule('vessels') && <li>✓ Vessels</li>}
              {canAccessModule('alerts') && <li>✓ Alerts</li>}
              {canAccessModule('roles') && <li>✓ Roles</li>}
              {canAccessModule('permissions') && <li>✓ Permissions</li>}
            </ul>
          </div>
          <div>
            <strong>Status:</strong>
            <ul className="mt-2 text-gray-600">
              <li>Super Admin: {isSuperAdmin() ? '✓ Yes' : '✗ No'}</li>
              <li>Total Permissions: {getModulePermissions('').length}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// STEP 7: Topbar/Navbar with Dynamic Links
// =============================================================================

export function Topbar() {
  const { can } = usePermission();
  const { user } = useAuth();

  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">SerenGuard</h1>
      
      <nav className="flex gap-4">
        {/* Users Link - only if user has permission */}
        {can('users.list') && (
          <a href="/users" className="text-blue-600 hover:underline">Users</a>
        )}
        
        {/* Vessels Link - only if user has permission */}
        {can('vessels.list') && (
          <a href="/vessels" className="text-blue-600 hover:underline">Vessels</a>
        )}
        
        {/* Alerts Link */}
        {can('alerts.list') && (
          <a href="/alerts" className="text-blue-600 hover:underline">Alerts</a>
        )}
        
        {/* Admin Link - only for admins */}
        {(can('roles.list') || can('permissions.list')) && (
          <a href="/admin" className="text-red-600 hover:underline font-bold">Admin</a>
        )}
        
        {/* User profile */}
        <span className="text-gray-600">{user?.first_name}</span>
      </nav>
    </header>
  );
}

// =============================================================================
// SUMMARY: What's Happening
// =============================================================================

/**
 * Flow:
 * 
 * 1. User logs in → SignIn component calls auth.login()
 * 2. AuthContext receives response with:
 *    - token (JWT)
 *    - user (user info)
 *    - roles (array of role names)
 *    - permissions (array of permission strings)
 * 
 * 3. Permissions & roles are stored in:
 *    - React state (in AuthContext)
 *    - localStorage (for persistence)
 * 
 * 4. usePermission hook retrieves them and provides functions:
 *    - can('permission.string') → boolean
 *    - canAny(['perm1', 'perm2']) → boolean (OR logic)
 *    - canAll(['perm1', 'perm2']) → boolean (AND logic)
 *    - canAccessModule('module_name') → boolean
 *    - getModulePermissions('module_name') → array
 *    - hasRole('role_name') → boolean
 *    - isSuperAdmin() → boolean
 * 
 * 5. Components use these functions to show/hide UI:
 *    <PermissionGate permission="users.list">
 *      <MyComponent />
 *    </PermissionGate>
 * 
 * 6. If user loses permission (manually updated in DB):
 *    - Call auth.refresh() to reload permissions
 *    - Or they get refreshed on next /me API call
 * 
 * Your API permissions structure:
 * - resource.subresource.action (e.g., users.roles.assign)
 * - resource.action (e.g., alerts.acknowledge)
 */

export default {
  UsersPage,
  UserEditForm,
  VesselsList,
  AlertsPage,
  Dashboard,
  Topbar,
};
