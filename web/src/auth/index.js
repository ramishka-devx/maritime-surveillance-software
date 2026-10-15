/**
 * SeranGuard RBAC Authentication Module
 * 
 * This module provides Role-Based Access Control for the Maritime Surveillance System.
 * 
 * @module auth
 */

// Core auth context and provider
export { AuthProvider, useAuth } from './AuthContext.jsx';

// Route protection components
export { RequireAuth } from './RequireAuth.jsx';
export { RequirePermission } from './RequirePermission.jsx';

// UI conditional rendering
export { PermissionGate, HideFromPermission } from './PermissionGate.jsx';

// Component wrapper for permission-based access control
export { withPermission } from './withPermission.jsx';

// Permission hook
export { usePermission } from './usePermission.js';

// Role constants and utilities
export { 
  Roles, 
  RoleIds,
  PermissionModules,
  Permissions,
  normalizeRole, 
  isOperator, 
  isSuperAdmin,
  isAdmin,
  isAnalyst,
  isViewer,
  hasAnyRole,
  getUserRoles,
} from './roles.js';
