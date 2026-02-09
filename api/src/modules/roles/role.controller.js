import { success } from '../../utils/apiResponse.js';
import { RoleService } from './role.service.js';

export const RoleController = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await RoleService.list({ page: Number(page), limit: Number(limit) });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getAll(req, res, next) {
    try {
      const data = await RoleService.getAll();
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const role = await RoleService.getById(Number(req.params.role_id));
      return success(res, role);
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const role = await RoleService.create(req.body);
      return success(res, role, 'Role created successfully', 201);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const role = await RoleService.update(Number(req.params.role_id), req.body);
      return success(res, role, 'Role updated successfully');
    } catch (e) {
      next(e);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await RoleService.delete(Number(req.params.role_id));
      return success(res, result, 'Role deleted successfully');
    } catch (e) {
      next(e);
    }
  },

  // ==========================================
  // Permission Management
  // ==========================================

  async getPermissions(req, res, next) {
    try {
      const permissions = await RoleService.getPermissions(Number(req.params.role_id));
      return success(res, permissions);
    } catch (e) {
      next(e);
    }
  },

  async getPermissionsWithAssignment(req, res, next) {
    try {
      const permissions = await RoleService.getPermissionsWithAssignment(Number(req.params.role_id));
      return success(res, permissions);
    } catch (e) {
      next(e);
    }
  },

  async assignPermission(req, res, next) {
    try {
      const result = await RoleService.assignPermission(
        Number(req.params.role_id),
        Number(req.body.permission_id),
        req.user?.user_id
      );
      return success(res, result, 'Permission assigned to role');
    } catch (e) {
      next(e);
    }
  },

  async revokePermission(req, res, next) {
    try {
      const result = await RoleService.revokePermission(
        Number(req.params.role_id),
        Number(req.body.permission_id)
      );
      return success(res, result, 'Permission revoked from role');
    } catch (e) {
      next(e);
    }
  },

  async syncPermissions(req, res, next) {
    try {
      const result = await RoleService.syncPermissions(
        Number(req.params.role_id),
        req.body.permission_ids,
        req.user?.user_id
      );
      return success(res, result, 'Role permissions synchronized');
    } catch (e) {
      next(e);
    }
  },

  // ==========================================
  // Statistics
  // ==========================================

  async getStats(req, res, next) {
    try {
      const stats = await RoleService.getStats();
      return success(res, stats);
    } catch (e) {
      next(e);
    }
  },

  async getUsersWithRole(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await RoleService.getUsersWithRole(
        Number(req.params.role_id),
        { page: Number(page), limit: Number(limit) }
      );
      return success(res, data);
    } catch (e) {
      next(e);
    }
  }
};