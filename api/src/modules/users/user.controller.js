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
  }
};
