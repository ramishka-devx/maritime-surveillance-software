import { success } from '../../utils/apiResponse.js';
import { PermissionService } from './permission.service.js';

export const PermissionController = {
  async create(req, res, next) {
    try {
      const permission = await PermissionService.create(req.body);
      return success(res, permission, 'Permission created', 201);
    } catch (e) { next(e); }
  },

  async requestAccess(req, res, next) {
    try {
      const requesterUserId = req.user?.user_id;
      const { permission, reason } = req.body;
      const data = await PermissionService.requestAccess({
        requesterUserId,
        permissionName: permission,
        reason,
      });
      return success(res, data, 'Request submitted');
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { page = 1, limit = 50, module } = req.query;
      const data = await PermissionService.list({ 
        page: Number(page), 
        limit: Number(limit),
        module 
      });
      return success(res, data);
    } catch (e) { next(e); }
  },

  async listAll(req, res, next) {
    try {
      const data = await PermissionService.listAll();
      return success(res, data);
    } catch (e) { next(e); }
  },

  async listByModule(req, res, next) {
    try {
      const data = await PermissionService.listByModule();
      return success(res, data);
    } catch (e) { next(e); }
  },

  async getModules(req, res, next) {
    try {
      const data = await PermissionService.getModules();
      return success(res, data);
    } catch (e) { next(e); }
  },

  async getById(req, res, next) {
    try {
      const permission = await PermissionService.getById(Number(req.params.permission_id));
      return success(res, permission);
    } catch (e) { next(e); }
  },

  async update(req, res, next) {
    try {
      const permission = await PermissionService.update(
        Number(req.params.permission_id),
        req.body
      );
      return success(res, permission, 'Permission updated');
    } catch (e) { next(e); }
  },

  async remove(req, res, next) {
    try {
      const result = await PermissionService.remove(Number(req.params.permission_id));
      return success(res, result, 'Permission deactivated');
    } catch (e) { next(e); }
  },

  async getRolesWithPermission(req, res, next) {
    try {
      const roles = await PermissionService.getRolesWithPermission(
        Number(req.params.permission_id)
      );
      return success(res, roles);
    } catch (e) { next(e); }
  },

  // Legacy methods for backward compatibility
  async assign(req, res, next) {
    try {
      await PermissionService.assign(req.body.role_id, req.body.permission_id);
      return success(res, null, 'Permission assigned');
    } catch (e) { next(e); }
  },

  async revoke(req, res, next) {
    try {
      await PermissionService.revoke(req.body.role_id, req.body.permission_id);
      return success(res, null, 'Permission revoked');
    } catch (e) { next(e); }
  }
};
