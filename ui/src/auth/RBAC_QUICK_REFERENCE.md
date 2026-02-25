# RBAC Quick Reference Card

## 📦 What You Have

When user logs in, your API returns:
```json
{
  "data": {
    "token": "JWT_TOKEN",
    "user": { "user_id": 1, "email": "...", "first_name": "...", ... },
    "roles": ["super_admin"],
    "permissions": ["users.list", "users.create", "alerts.view", ...]
  }
}
```

This is automatically **stored**, **persisted**, and **available** across your app.

---

## 🔧 3 Ways to Implement RBAC

### **1️⃣ PermissionGate (Wrap Sections)**
```jsx
import { PermissionGate } from '../auth';

// Single permission
<PermissionGate permission="users.list">
  <button>View Users</button>
</PermissionGate>

// Multiple (OR - user needs ANY)
<PermissionGate permissions={['users.create', 'users.update']}>
  <UserForm />
</PermissionGate>

// Multiple (AND - user needs ALL)
<PermissionGate permissions={['users.view', 'users.delete']} requireAll>
  <DeleteButton />
</PermissionGate>

// Fallback UI
<PermissionGate 
  permission="admin.access"
  fallback={<p>No access</p>}
>
  <AdminPanel />
</PermissionGate>
```

### **2️⃣ usePermission Hook (Logic)**
```jsx
import { usePermission } from '../auth';

export function MyComponent() {
  const { can, canAny, canAll, hasRole, isSuperAdmin } = usePermission();

  // Single check
  if (!can('users.list')) return <div>No access</div>;

  // Multiple checks (OR)
  if (canAny(['users.create', 'users.update'])) {
    // User has at least one permission
  }

  // Multiple checks (AND)
  if (canAll(['users.view', 'users.delete'])) {
    // User has both permissions
  }

  // Role check
  if (hasRole('admin')) { /* ... */ }

  // Super admin
  if (isSuperAdmin()) { /* ... */ }

  return (
    <div>
      {can('users.update') && <button>Edit</button>}
      {canAny(['reports.create', 'reports.export']) && <button>Report</button>}
    </div>
  );
}
```

### **3️⃣ withPermission HOC (Custom Components)**
```jsx
import { withPermission } from '../auth';

// Create a reusable protected button
function ActionButton({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

const ProtectedActionButton = withPermission(ActionButton);

// Use it
<ProtectedActionButton
  requiredPermission="users.delete"
  label="Delete User"
  fallback={<span>No delete access</span>}
  onClick={handleDelete}
/>
```

---

## 📋 Your API Permissions List

From your login response, you have these permissions:

**Users Management:**
- `users.list` - View users list
- `users.create` - Create user
- `users.update` - Update user
- `users.delete` - Delete user
- `users.verify` - Verify user email
- `users.suspend` - Suspend user
- `users.view` - View user details
- `users.activity.view` - View user activity
- `users.roles.assign` - Assign roles to user
- `users.permissions.assign` - Assign permissions
- `users.permissions.view` - View user permissions

**Vessels Management:**
- `vessels.list` - View vessels
- `vessels.create` - Create vessel
- `vessels.update` - Update vessel
- `vessels.delete` - Delete vessel
- `vessels.view` - View vessel details
- `vessels.positions.create` - Create position entry
- `vessels.positions.view` - View vessel positions
- `vessels.history.view` - View vessel history

**Alerts & Notifications:**
- `alerts.list` - View alerts
- `alerts.view` - View alert details
- `alerts.create` - Create alert
- `alerts.update` - Update alert
- `alerts.acknowledge` - Acknowledge alert
- `alerts.resolve` - Resolve alert
- `alerts.dismiss` - Dismiss alert
- `alerts.assign` - Assign alert to user
- `notifications.view` - View notifications
- `notifications.delete` - Delete notifications

**Roles & Permissions (Admin):**
- `roles.list` - View roles
- `roles.view` - View role details
- `roles.create` - Create role
- `roles.update` - Update role
- `roles.delete` - Delete role
- `roles.permissions.view` - View role permissions
- `roles.permissions.assign` - Assign permissions to role
- `roles.permissions.revoke` - Revoke permissions from role
- `permissions.list` - View all permissions
- `permissions.view` - View permission details
- `permissions.create` - Create permission
- `permissions.delete` - Delete permission

**Activities & Analytics:**
- `activities.logs.list` - View activity logs
- `activities.logs.view` - View activity details
- `analytics.dashboard.view` - View analytics
- `dashboard.map.view` - View map on dashboard
- `dashboard.active_alerts.view` - View active alerts on dashboard
- `ais.view` - View AIS data

---

## 🚀 Common Patterns

### Pattern 1: Protected Button
```jsx
<PermissionGate permission="users.delete">
  <button onClick={deleteUser}>Delete</button>
</PermissionGate>
```

### Pattern 2: Conditional Table Column
```jsx
const { can } = usePermission();

<table>
  <td>Name</td>
  <td>Email</td>
  {can('users.update') && <td>Actions</td>}
</table>
```

### Pattern 3: Admin Section
```jsx
<PermissionGate permissions={['roles.list', 'permissions.list']}>
  <AdminPanel>
    {can('roles.list') && <RolesTable />}
    {can('permissions.list') && <PermissionsTable />}
  </AdminPanel>
</PermissionGate>
```

### Pattern 4: Module Access
```jsx
const { canAccessModule, getModulePermissions } = usePermission();

if (!canAccessModule('users')) {
  return <div>Access Denied</div>;
}

const userPerms = getModulePermissions('users');
console.log(userPerms); // ['users.list', 'users.view', ...]
```

### Pattern 5: Form with Conditional Fields
```jsx
const { can, canAll } = usePermission();

<form>
  <input placeholder="Email" />
  
  {/* Only if user can both view AND update */}
  {canAll(['users.view', 'users.update']) && (
    <input placeholder="Additional field" />
  )}
  
  {/* Only if user can delete */}
  {can('users.delete') && (
    <input type="checkbox" label="Delete?" />
  )}
</form>
```

---

## 🔄 Updating Permissions

If permissions change (e.g., admin updates them in database):

```jsx
import { useAuth } from '../auth';

function Settings() {
  const { refresh } = useAuth();

  return (
    <button onClick={refresh}>
      Refresh Permissions
    </button>
  );
}
```

Or they auto-refresh on page reload since they're stored in localStorage.

---

## 💡 Best Practices

✅ **DO:**
- Use permission names consistently (e.g., `resource.action`)
- Check permissions before showing dangerous actions
- Provide fallback UI for denied access
- Use `canAccessModule()` for module-level checks
- Cache permission checks in custom hooks

❌ **DON'T:**
- Rely only on frontend checks (always validate on backend)
- Show permission-denied errors for security features
- Make API calls without checking permissions first
- Store sensitive info in localStorage beyond token/permissions

---

## 🧪 Testing

```jsx
// Mock permissions in tests
const mockUsePermission = jest.fn(() => ({
  can: jest.fn(() => true),
  canAny: jest.fn(() => true),
  canAll: jest.fn(() => false),
  hasRole: jest.fn(() => false),
  isSuperAdmin: jest.fn(() => false),
}));

jest.mock('../auth', { usePermission: mockUsePermission });
```

---

## 📞 API Integration

**Login Request:**
```bash
POST /api/users/login
{ "identifier": "admin", "password": "..." }
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": {...},
    "roles": [...],
    "permissions": [...]
  }
}
```

**Refresh Permissions:**
```bash
GET /api/users/me
Authorization: Bearer {token}
```

---

## 🎯 Component Structure Example

```jsx
import { PermissionGate } from '../auth/PermissionGate.jsx';
import { usePermission } from '../auth/usePermission.js';

export function UsersDashboard() {
  const { can, canAny } = usePermission();

  return (
    <div>
      <h1>Users</h1>

      {/* Public section - always visible */}
      <div>Search bar</div>

      {/* Protected section - list */}
      <PermissionGate permission="users.list">
        <UsersList />
      </PermissionGate>

      {/* Protected section - create */}
      <PermissionGate permission="users.create">
        <CreateUserButton />
      </PermissionGate>

      {/* Conditional elements */}
      {can('users.update') && <EditButtons />}
      {can('users.delete') && <DeleteButtons />}
      {canAny(['users.verify', 'users.suspend']) && <AdminActions />}
    </div>
  );
}
```

---

## ✨ Summary

| Need | Use This | Code |
|------|----------|------|
| Wrap a section | `PermissionGate` | `<PermissionGate permission="..."><Component/></PermissionGate>` |
| Show/hide element | `usePermission` hook | `{can('...') && <Element/>}` |
| Wrap component | `withPermission` HOC | `const Protected = withPermission(Component)` |
| Check permission | `usePermission` hook | `const { can } = usePermission(); can('...')` |
| Multiple perms (OR) | Any of above | `permissions={['a', 'b']}` or `canAny([...])` |
| Multiple perms (AND) | Any of above | `permissions={[...]} requireAll` or `canAll([...])` |
| Module access | `usePermission` hook | `canAccessModule('users')` |
| Super admin | `usePermission` hook | `isSuperAdmin()` |

---

**That's it! You have a complete RBAC system ready to use.** 🎉
