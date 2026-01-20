import { UserModel, hashPassword, comparePassword } from './user.model.js';
import { badRequest, unauthorized, notFound } from '../../utils/errorHandler.js';
import { signToken } from '../../utils/jwtHelper.js';

export const UserService = {
  async register({ first_name, last_name, email, password }) {
    const exists = await UserModel.findByEmail(email);
    if (exists) throw badRequest('Email already in use');
    const password_hash = await hashPassword(password);
    const role_id = 1; // default role
    const user = await UserModel.create({ first_name, last_name, email, password_hash, role_id });
    return user;
  },
  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw unauthorized('Invalid credentials');
    if(user?.status != 'verified') throw unauthorized("only verified users can login!")
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) throw unauthorized('Invalid credentials');
    const token = signToken({ user_id: user.user_id, role_id: user.role_id, email: user.email });
    return { token };
  },
  async getProfile(user_id) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    return user;
  },
  async list(params) {
    return UserModel.list(params);
  },
  async update(user_id, payload) {
    return UserModel.update(user_id, payload);
  },
  async remove(user_id) {
    return UserModel.remove(user_id);
  },
  async updateStatus(user_id, status) {
    const allowed = ['pending', 'verified', 'deleted'];
    if (!allowed.includes(status)) throw badRequest('Invalid status');
    return UserModel.updateStatus(user_id, status);
  },
  async getAnalytics() {
    return UserModel.getAnalytics();
  },
  async updateRole(user_id, role_id) {
    if (!Number.isInteger(role_id)) throw badRequest('Invalid role id');
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    return UserModel.updateRole(user_id, role_id);
  }
};
