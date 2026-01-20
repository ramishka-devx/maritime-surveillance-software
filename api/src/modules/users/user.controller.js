import { success } from '../../utils/apiResponse.js';
import { UserService } from './user.service.js';

export const UserController = {
  async register(req, res, next) {
    try {
      const user = await UserService.register(req.body);
      return success(res, user, 'User registered', 201);
    } catch (e) {
      next(e);
    }
  },
  async login(req, res, next) {
    try {
      const data = await UserService.login(req.body);
      return success(res, data, 'Logged in');
    } catch (e) {
      next(e);
    }
  },
  async me(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.user_id);
      return success(res, user);
    } catch (e) {
      next(e);
    }
  },
  async list(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await UserService.list({ page: Number(page), limit: Number(limit) });
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },
  async update(req, res, next) {
    try {
      const user = await UserService.update(Number(req.params.user_id), req.body);
      return success(res, user, 'User updated');
    } catch (e) {
      next(e);
    }
  },
  async remove(req, res, next) {
    try {
      await UserService.remove(Number(req.params.user_id));
      return success(res, null, 'User removed', 204);
    } catch (e) {
      next(e);
    }
  },
  async updateStatus(req, res, next) {
    try {
      const user = await UserService.updateStatus(Number(req.params.user_id), req.body.status);
      return success(res, user, 'Status updated');
    } catch (e) {
      next(e);
    }
  },
  async analytics(req, res, next) {
    try {
      const data = await UserService.getAnalytics();
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },
  async updateRole(req, res, next) {
    try {
      const user = await UserService.updateRole(
        Number(req.params.user_id),
        Number(req.body.role_id)
      );
      return success(res, user, 'Role updated');
    } catch (e) {
      next(e);
    }
  },
  async listUserPermissions(req, res, next) {
    try {
      const data = await UserService.listPermissionsForUser(Number(req.params.user_id));
      return success(res, data);
    } catch (e) {
      next(e);
    }
  },
  async assignUserPermission(req, res, next) {
    try {
      const data = await UserService.assignPermissionToUser(
        Number(req.params.user_id),
        Number(req.body.permission_id)
      );
      return success(res, data, 'Permission granted');
    } catch (e) {
      next(e);
    }
  },
  async revokeUserPermission(req, res, next) {
    try {
      const data = await UserService.revokePermissionFromUser(
        Number(req.params.user_id),
        Number(req.body.permission_id)
      );
      return success(res, data, 'Permission revoked');
    } catch (e) {
      next(e);
    }
  },

  // ==========================================
  // Multi-Role Management
  // ==========================================

  async getUserRoles(req, res, next) {
    try {
      const roles = await UserService.getUserRoles(Number(req.params.user_id));
      return success(res, roles);
    } catch (e) {
      next(e);
    }
  },

  async assignRole(req, res, next) {
    try {
      const data = await UserService.assignRoleToUser(
        Number(req.params.user_id),
        Number(req.body.role_id),
        req.user?.user_id
      );
      return success(res, data, 'Role assigned');
    } catch (e) {
      next(e);
    }
  },

  async removeRole(req, res, next) {
    try {
      const data = await UserService.removeRoleFromUser(
        Number(req.params.user_id),
        Number(req.body.role_id)
      );
      return success(res, data, 'Role removed');
    } catch (e) {
      next(e);
    }
  },

  async syncRoles(req, res, next) {
    try {
      const data = await UserService.syncUserRoles(
        Number(req.params.user_id),
        req.body.role_ids,
        req.user?.user_id
      );
      return success(res, data, 'Roles synchronized');
    } catch (e) {
      next(e);
    }
  },

  async getDirectPermissions(req, res, next) {
    try {
      const permissions = await UserService.getDirectPermissions(Number(req.params.user_id));
      return success(res, permissions);
    } catch (e) {
      next(e);
    }
  },

  async getEffectivePermissions(req, res, next) {
    try {
      const permissions = await UserService.getEffectivePermissions(Number(req.params.user_id));
      return success(res, permissions);
    } catch (e) {
      next(e);
    }
  }
};
