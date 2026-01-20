import { RoleModel } from './role.model.js';
import { notFound, badRequest } from '../../utils/errorHandler.js';

export const RoleService = {
  async list(params) {
    return RoleModel.list(params);
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

    const { name } = roleData;
    
    // Check if new name already exists (excluding current role)
    const nameExists = await RoleModel.checkNameExists(name, role_id);
    if (nameExists) {
      throw badRequest('Role name already exists');
    }

    return RoleModel.update(role_id, roleData);
  },

  async delete(role_id) {
    // Check if role exists
    const existingRole = await RoleModel.findById(role_id);
    if (!existingRole) {
      throw notFound('Role not found');
    }

    const deleted = await RoleModel.delete(role_id);
    if (!deleted) {
      throw badRequest('Failed to delete role');
    }

    return { message: 'Role deleted successfully' };
  }
};