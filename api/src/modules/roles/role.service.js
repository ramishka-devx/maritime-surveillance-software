import { RoleModel } from './role.model.js';
import { notFound, badRequest } from '../../utils/errorHandler.js';
import { query } from '../../config/db.config.js';

export const RoleService = {
  async list(params) {
    return RoleModel.list({ ...params, includePermissionCount: true });
  },

  async getAll() {
    return RoleModel.getAll();
  },

  async getById(role_id) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');
    return role;
  },

  async create(roleData) {
    const { name } = roleData;
    
    // Check if role name already exists
    const nameExists = await RoleModel.checkNameExists(name);
    if (nameExists) {
      throw badRequest('Role name already exists');
    }

    return RoleModel.create(roleData);
  },

  async update(role_id, roleData) {
    // Check if role exists
    const existingRole = await RoleModel.findById(role_id);
    if (!existingRole) {
      throw notFound('Role not found');
    }

    // Prevent modifying system roles name
    if (existingRole.is_system && roleData.name && roleData.name !== existingRole.name) {
      throw badRequest('Cannot rename system roles');
    }

    const { name } = roleData;
    
    // Check if new name already exists (excluding current role)
    if (name) {
      const nameExists = await RoleModel.checkNameExists(name, role_id);
      if (nameExists) {
        throw badRequest('Role name already exists');
      }
    }

    return RoleModel.update(role_id, roleData);
  },

  async delete(role_id) {
    // Check if role exists
    const existingRole = await RoleModel.findById(role_id);
    if (!existingRole) {
      throw notFound('Role not found');
    }

    // Prevent deleting system roles
    if (existingRole.is_system) {
      throw badRequest('Cannot delete system roles');
    }

    // Check if role is assigned to users
    const [{ count }] = await query(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [role_id]
    );
    if (count > 0) {
      throw badRequest('Cannot delete role that is assigned to users. Remove role from all users first.');
    }

    const deleted = await RoleModel.delete(role_id);
    if (!deleted) {
      throw badRequest('Failed to delete role');
    }

    return { message: 'Role deleted successfully' };
  },

  // ==========================================
  // Permission Management
  // ==========================================

  async getPermissions(role_id) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');
    
    return RoleModel.getPermissions(role_id);
  },

  async getPermissionsWithAssignment(role_id) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');
    
    return RoleModel.getPermissionsWithAssignment(role_id);
  },

  async assignPermission(role_id, permission_id, granted_by = null) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');

    // Verify permission exists
    const [perm] = await query(
      'SELECT permission_id FROM permissions WHERE permission_id = ? AND is_active = 1',
      [permission_id]
    );
    if (!perm) throw badRequest('Permission not found');

    await RoleModel.assignPermission(role_id, permission_id, granted_by);
    return { role_id, permission_id, message: 'Permission assigned' };
  },

  async revokePermission(role_id, permission_id) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');

    await RoleModel.revokePermission(role_id, permission_id);
    return { role_id, permission_id, message: 'Permission revoked' };
  },

  async syncPermissions(role_id, permission_ids, granted_by = null) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');

    // Validate all permission IDs exist
    if (permission_ids && permission_ids.length > 0) {
      const placeholders = permission_ids.map(() => '?').join(', ');
      const validPerms = await query(
        `SELECT permission_id FROM permissions WHERE permission_id IN (${placeholders}) AND is_active = 1`,
        permission_ids
      );
      
      if (validPerms.length !== permission_ids.length) {
        throw badRequest('One or more permissions are invalid');
      }
    }

    await RoleModel.syncPermissions(role_id, permission_ids || [], granted_by);
    return { role_id, permission_count: permission_ids?.length || 0, message: 'Permissions synced' };
  },

  // ==========================================
  // Statistics
  // ==========================================

  async getStats() {
    return RoleModel.getRoleStats();
  },

  async getUsersWithRole(role_id, params) {
    const role = await RoleModel.findById(role_id);
    if (!role) throw notFound('Role not found');
    
    return RoleModel.getUsersWithRole(role_id, params);
  }
};