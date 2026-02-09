/**
 * Permission Helper Utilities
 * 
 * Provides utilities for working with the RBAC permission system.
 * This module is designed to be used across the application for
 * permission checking and management.
 */

import { query } from '../config/db.config.js';

/**
 * Get all permissions for a user by aggregating:
 * 1. Permissions from all assigned roles (via user_roles table)
 * 2. Direct user permissions (via user_permissions table)
 * 
 * @param {number} userId - The user ID
 * @returns {Promise<string[]>} Array of permission names
 */
export async function getUserPermissions(userId) {
  const sql = `
    SELECT DISTINCT p.name
    FROM permissions p
    WHERE p.is_active = 1
      AND (
        -- Permissions from user's roles (multi-role support)
        EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN role_permissions rp ON rp.role_id = ur.role_id
          WHERE ur.user_id = ? AND rp.permission_id = p.permission_id
        )
        -- Direct user permissions
        OR EXISTS (
          SELECT 1
          FROM user_permissions up
          WHERE up.user_id = ? AND up.permission_id = p.permission_id
        )
        -- Fallback: Legacy single role from users table
        OR EXISTS (
          SELECT 1
          FROM users u
          JOIN role_permissions rp ON rp.role_id = u.role_id
          WHERE u.user_id = ? AND rp.permission_id = p.permission_id
        )
      )
    ORDER BY p.name
  `;
  
  const rows = await query(sql, [userId, userId, userId]);
  return rows.map(row => row.name);
}

/**
 * Get all roles for a user
 * 
 * @param {number} userId - The user ID
 * @returns {Promise<Array<{role_id: number, name: string, description: string}>>}
 */
export async function getUserRoles(userId) {
  const sql = `
    SELECT DISTINCT r.role_id, r.name, r.description
    FROM roles r
    WHERE r.is_active = 1
      AND (
        -- From user_roles table (multi-role)
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = ? AND ur.role_id = r.role_id
        )
        -- Fallback: Legacy single role from users table
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id = ? AND u.role_id = r.role_id
        )
      )
    ORDER BY r.name
  `;
  
  const rows = await query(sql, [userId, userId]);
  return rows;
}

/**
 * Check if a user has a specific permission
 * 
 * @param {number} userId - The user ID
 * @param {string} permissionName - The permission name to check
 * @returns {Promise<boolean>}
 */
export async function userHasPermission(userId, permissionName) {
  const sql = `
    SELECT 1
    FROM permissions p
    WHERE p.name = ? AND p.is_active = 1
      AND (
        -- From user's roles
        EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN role_permissions rp ON rp.role_id = ur.role_id
          WHERE ur.user_id = ? AND rp.permission_id = p.permission_id
        )
        -- Direct user permission
        OR EXISTS (
          SELECT 1
          FROM user_permissions up
          WHERE up.user_id = ? AND up.permission_id = p.permission_id
        )
        -- Fallback: Legacy single role
        OR EXISTS (
          SELECT 1
          FROM users u
          JOIN role_permissions rp ON rp.role_id = u.role_id
          WHERE u.user_id = ? AND rp.permission_id = p.permission_id
        )
      )
    LIMIT 1
  `;
  
  const rows = await query(sql, [permissionName, userId, userId, userId]);
  return rows.length > 0;
}

/**
 * Check if a user has ANY of the specified permissions
 * 
 * @param {number} userId - The user ID
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {Promise<boolean>}
 */
export async function userHasAnyPermission(userId, permissionNames) {
  if (!permissionNames || permissionNames.length === 0) return false;
  
  const placeholders = permissionNames.map(() => '?').join(', ');
  const sql = `
    SELECT 1
    FROM permissions p
    WHERE p.name IN (${placeholders}) AND p.is_active = 1
      AND (
        EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN role_permissions rp ON rp.role_id = ur.role_id
          WHERE ur.user_id = ? AND rp.permission_id = p.permission_id
        )
        OR EXISTS (
          SELECT 1
          FROM user_permissions up
          WHERE up.user_id = ? AND up.permission_id = p.permission_id
        )
        OR EXISTS (
          SELECT 1
          FROM users u
          JOIN role_permissions rp ON rp.role_id = u.role_id
          WHERE u.user_id = ? AND rp.permission_id = p.permission_id
        )
      )
    LIMIT 1
  `;
  
  const rows = await query(sql, [...permissionNames, userId, userId, userId]);
  return rows.length > 0;
}

/**
 * Check if a user has ALL of the specified permissions
 * 
 * @param {number} userId - The user ID
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {Promise<boolean>}
 */
export async function userHasAllPermissions(userId, permissionNames) {
  if (!permissionNames || permissionNames.length === 0) return true;
  
  const userPerms = await getUserPermissions(userId);
  return permissionNames.every(perm => userPerms.includes(perm));
}

/**
 * Check if a user has a specific role
 * 
 * @param {number} userId - The user ID
 * @param {string} roleName - The role name to check
 * @returns {Promise<boolean>}
 */
export async function userHasRole(userId, roleName) {
  const sql = `
    SELECT 1
    FROM roles r
    WHERE r.name = ? AND r.is_active = 1
      AND (
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = ? AND ur.role_id = r.role_id
        )
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id = ? AND u.role_id = r.role_id
        )
      )
    LIMIT 1
  `;
  
  const rows = await query(sql, [roleName, userId, userId]);
  return rows.length > 0;
}

/**
 * Check if a user is a super admin
 * Super admins bypass all permission checks
 * 
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>}
 */
export async function isSuperAdmin(userId) {
  return userHasRole(userId, 'super_admin');
}

/**
 * Get all permissions grouped by module
 * Useful for permission management UIs
 * 
 * @returns {Promise<Object>} Object with module names as keys and permission arrays as values
 */
export async function getPermissionsByModule() {
  const sql = `
    SELECT permission_id, name, module, description
    FROM permissions
    WHERE is_active = 1
    ORDER BY module, name
  `;
  
  const rows = await query(sql);
  const grouped = {};
  
  for (const row of rows) {
    const module = row.module || 'other';
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push({
      permission_id: row.permission_id,
      name: row.name,
      description: row.description
    });
  }
  
  return grouped;
}

/**
 * Get permission details by name
 * 
 * @param {string} permissionName - The permission name
 * @returns {Promise<Object|null>}
 */
export async function getPermissionByName(permissionName) {
  const sql = `
    SELECT permission_id, name, module, description, is_active, created_at
    FROM permissions
    WHERE name = ?
    LIMIT 1
  `;
  
  const rows = await query(sql, [permissionName]);
  return rows[0] || null;
}

/**
 * Build a full auth payload for frontend consumption
 * Returns user info, roles, and permissions
 * 
 * @param {number} userId - The user ID
 * @returns {Promise<Object>}
 */
export async function buildAuthPayload(userId) {
  const [roles, permissions] = await Promise.all([
    getUserRoles(userId),
    getUserPermissions(userId)
  ]);
  
  return {
    roles: roles.map(r => r.name),
    permissions
  };
}

export default {
  getUserPermissions,
  getUserRoles,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  userHasRole,
  isSuperAdmin,
  getPermissionsByModule,
  getPermissionByName,
  buildAuthPayload
};
