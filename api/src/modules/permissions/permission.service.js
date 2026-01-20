import { PermissionModel } from './permission.model.js';
import { notFound, badRequest } from '../../utils/errorHandler.js';

export const PermissionService = {
  async create(payload) {
    const { name } = payload;
    
    // Check if permission name already exists
    const exists = await PermissionModel.checkNameExists(name);
    if (exists) {
      throw badRequest('Permission name already exists');
    }
    
    return PermissionModel.create(payload);
  },

  async list(params = {}) {
    return PermissionModel.list(params);
  },

  async listAll() {
    return PermissionModel.listAll();
  },

  async listByModule() {
    return PermissionModel.listByModule();
  },

  async getModules() {
    return PermissionModel.getModules();
  },

  async getById(permission_id) {
    const permission = await PermissionModel.findById(permission_id);
    if (!permission) throw notFound('Permission not found');
    return permission;
  },

  async getByName(name) {
    const permission = await PermissionModel.findByName(name);
    if (!permission) throw notFound('Permission not found');
    return permission;
  },

  async update(permission_id, data) {
    const existing = await PermissionModel.findById(permission_id);
    if (!existing) throw notFound('Permission not found');
    
    if (data.name && data.name !== existing.name) {
      const nameExists = await PermissionModel.checkNameExists(data.name, permission_id);
      if (nameExists) {
        throw badRequest('Permission name already exists');
      }
    }
    
    return PermissionModel.update(permission_id, data);
  },

  async remove(permission_id) {
    const existing = await PermissionModel.findById(permission_id);
    if (!existing) throw notFound('Permission not found');
    
    await PermissionModel.remove(permission_id);
    return { message: 'Permission deactivated successfully' };
  },

  async getRolesWithPermission(permission_id) {
    const existing = await PermissionModel.findById(permission_id);
    if (!existing) throw notFound('Permission not found');
    
    return PermissionModel.getRolesWithPermission(permission_id);
  },

  // Legacy methods for backward compatibility
  assign: (role_id, permission_id) => PermissionModel.assign(role_id, permission_id),
  revoke: (role_id, permission_id) => PermissionModel.revoke(role_id, permission_id)
};
