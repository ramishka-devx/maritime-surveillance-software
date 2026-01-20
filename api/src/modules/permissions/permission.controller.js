import { success } from '../../utils/apiResponse.js';
import { PermissionService } from './permission.service.js';

export const PermissionController = {
  async create(req, res, next) {
    try {
      const permission = await PermissionService.create(req.body);
      return success(res, permission, 'Permission created', 201);
    } catch (e) { next(e); }
  },
  async list(req, res, next) {
    try {
      const data = await PermissionService.list();
      return success(res, data);
    } catch (e) { next(e); }
  },
  async remove(req, res, next) {
    try {
      await PermissionService.remove(Number(req.params.permission_id));
      return success(res, null, 'Permission removed', 204);
    } catch (e) { next(e); }
  },
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
