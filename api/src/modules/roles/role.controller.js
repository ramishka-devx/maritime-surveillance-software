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
  }
};