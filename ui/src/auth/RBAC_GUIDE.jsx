/**
 * RBAC Implementation Guide for SeranGuard
 * 
 * This guide shows you all the ways to implement Role-Based Access Control
 * in your React application using SeranGuard's RBAC system.
 */

// ============================================================================
// METHOD 1: Using PermissionGate Component (Recommended for conditional UI)
// ============================================================================

import { PermissionGate, HideFromPermission } from '../auth/index.js';

export function Example1_PermissionGate() {
  return (
    <>
      {/* Show only if user has permission */}
      <PermissionGate permission="users.list">
        <button>View Users</button>
      </PermissionGate>

      {/* Multiple permissions (OR logic - show if user has ANY) */}
      <PermissionGate permissions={['alerts.acknowledge', 'alerts.resolve']}>
        <div className="alert-actions">Alert Actions Available</div>
      </PermissionGate>

      {/* Multiple permissions (AND logic - show only if user has ALL) */}
      <PermissionGate permissions={['users.view', 'users.update']} requireAll>
        <form>Edit User</form>
      </PermissionGate>

      {/* Role-based access */}
      <PermissionGate role="admin">
        <button>Admin Panel</button>
      </PermissionGate>

      {/* With fallback UI */}
      <PermissionGate 
        permission="admin.access"
        fallback={<p>You don't have access to this section</p>}
      >
        <div>Admin Section</div>
      </PermissionGate>

      {/* Hide from users with permission */}
      <HideFromPermission permission="membership.paid">
        <div>Upgrade your membership</div>
      </HideFromPermission>
    </>
  );
}


// ============================================================================
// METHOD 2: Using withPermission HOC (For wrapping custom components)
// ============================================================================

import { withPermission } from '../auth/index.js';

// Create a custom component
function CustomButton({ label, onClick, ...props }) {
  return <button {...props} onClick={onClick}>{label}</button>;
}

// Wrap it with withPermission HOC
const ProtectedCustomButton = withPermission(CustomButton);

export function Example2_WithPermissionHOC() {
  const handleClick = () => console.log('Clicked!');

  return (
    <>
      {/* Use with single permission */}
      <ProtectedCustomButton 
        requiredPermission="users.create"
        label="Create User" 
        onClick={handleClick}
      />

      {/* Use with multiple permissions (OR) */}
      <ProtectedCustomButton 
        requiredPermissions={['users.create', 'users.update']}
        label="Manage Users" 
        onClick={handleClick}
      />

      {/* Use with multiple permissions (AND) */}
      <ProtectedCustomButton 
        requiredPermissions={['users.view', 'users.delete']}
        requireAll
        label="Delete User" 
        onClick={handleClick}
      />

      {/* Use with role */}
      <ProtectedCustomButton 
        requiredRole="admin"
        label="Admin Action" 
        onClick={handleClick}
      />

      {/* Super admin only */}
      <ProtectedCustomButton 
        superAdminOnly
        label="Super Admin Only" 
        onClick={handleClick}
      />

      {/* With fallback UI */}
      <ProtectedCustomButton 
        requiredPermission="premium.feature"
        fallback={<span className="text-gray-400">Upgrade to access</span>}
        label="Premium Feature" 
        onClick={handleClick}
      />
    </>
  );
}


// ============================================================================
// METHOD 3: Using Pre-wrapped Components (Easiest for common elements)
// ============================================================================




// ============================================================================
// METHOD 4: Using usePermission Hook (For logic/conditional rendering)
// ============================================================================

import { usePermission } from '../auth/index.js';

export function Example4_UsePermissionHook() {
  const { can, canAny, canAll, canAccessModule, hasRole, isSuperAdmin } = usePermission();

  // Check single permission
  if (!can('users.list')) {
    return <div>You don't have access</div>;
  }

  // Conditional rendering based on permissions
  const canEditUsers = can('users.update');
  const canDeleteUsers = can('users.delete');
  
  // Check multiple permissions (OR)
  const isAnyAllowed = canAny(['documents.read', 'documents.write']);
  
  // Check multiple permissions (AND)
  const isAllAllowed = canAll(['documents.read', 'documents.write', 'documents.delete']);

  // Check role
  const isAdmin = hasRole('admin');

  // Check module access
  const hasAnalyticsAccess = canAccessModule('analytics');

  // Check super admin
  const isSuperAdminUser = isSuperAdmin();

  return (
    <div>
      {canEditUsers && <button>Edit User</button>}
      {canDeleteUsers && <button>Delete User</button>}
      {isAnyAllowed && <div>Can access documents</div>}
      {isAllAllowed && <div>Can fully manage documents</div>}
      {isAdmin && <div>Admin Panel</div>}
      {hasAnalyticsAccess && <div>Analytics Dashboard</div>}
      {isSuperAdminUser && <div>Super Admin Controls</div>}
    </div>
  );
}


// ============================================================================
// REAL WORLD EXAMPLE: Complete User Management Panel
// ============================================================================

export function UserManagementPanel() {
  const { canAny } = usePermission();

  return (
    <div className="p-6">
      <h1>User Management</h1>

      {/* View Users Button */}
      <ProtectedButton 
        requiredPermission="users.list"
        className="btn btn-primary"
      >
        View All Users
      </ProtectedButton>

      {/* Create User Section */}
      <ProtectedSection requiredPermission="users.create">
        <h2>Create New User</h2>
        {/* Form content */}
      </ProtectedSection>

      {/* Edit User Section */}
      <ProtectedDiv requiredPermission="users.update">
        <h2>Edit User Details</h2>
        <ProtectedInput 
          requiredPermission="users.update"
          type="text" 
          placeholder="User name" 
        />
        <ProtectedButton requiredPermission="users.update">
          Save Changes
        </ProtectedButton>
      </ProtectedDiv>

      {/* Delete User - Requires special permissions */}
      <PermissionGate 
        permissions={['users.delete', 'users.manage']}
        fallback={<p className="text-red-500">Delete access restricted</p>}
      >
        <button className="btn btn-danger">delete User</button>
      </PermissionGate>

      {/* Admin Only Features */}
      <ProtectedSection 
        requiredRole="admin"
        fallback={<p>Admin features not available</p>}
      >
        <h2>Advanced Admin Controls</h2>
        <button>Batch Operations</button>
        <button>Audit Logs</button>
      </ProtectedSection>

      {/* Conditional UI based on multiple permissions */}
      {canAny(['users.create', 'users.update']) && (
        <div className="mt-4 p-4 bg-blue-50">
          You can modify user data
        </div>
      )}
    </div>
  );
}


// ============================================================================
// PERMISSION NAMING CONVENTION
// ============================================================================

/**
 * Use this format for permission names:
 * 
 * resource.action
 * 
 * Examples:
 * - users.list      : View list of users
 * - users.create    : Create new user
 * - users.read      : Read user details
 * - users.update    : Update user information
 * - users.delete    : Delete user
 * - users.manage    : Full management of users
 * 
 * - alerts.view     : View alerts
 * - alerts.acknowledge : Acknowledge alerts
 * - alerts.resolve  : Resolve alerts
 * 
 * - reports.view    : View reports
 * - reports.export  : Export reports
 * - reports.create  : Create reports
 * 
 * - admin.access    : Access admin panel
 * - admin.settings  : Modify admin settings
 * - admin.users     : Admin user management
 */


// ============================================================================
// QUICK REFERENCE - When to Use Each Method
// ============================================================================

/**
 * 1. PermissionGate Component
 *    ✓ Best for: Wrapping JSX/components
 *    ✓ Use when: You need conditional rendering
 *    ✓ Example: <PermissionGate permission="users.list"><button>View</button></PermissionGate>
 * 
 * 2. withPermission HOC
 *    ✓ Best for: Wrapping custom components
 *    ✓ Use when: You have reusable components to protect
 *    ✓ Example: const Protected = withPermission(MyComponent)
 * 
 * 3. usePermission Hook
 *    ✓ Best for: Logic/complex checks
 *    ✓ Use when: You need fine-grained control in component logic
 *    ✓ Example: if (can('users.delete')) { ... }
 */
