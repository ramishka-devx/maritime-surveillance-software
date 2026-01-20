import { UserModel, hashPassword, comparePassword } from './user.model.js';
import { badRequest, unauthorized, notFound } from '../../utils/errorHandler.js';
import { signToken } from '../../utils/jwtHelper.js';
import { env } from '../../config/env.js';

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function roleToId(role) {
  const r = normalizeRole(role);
  if (!r || r === 'operator') return 2;
  if (r === 'super_admin') return 1;
  return null;
}

export const UserService = {
  async register({ first_name, last_name, email, password, role, admin_registration_secret }) {
    const exists = await UserModel.findByEmail(email);
    if (exists) throw badRequest('Email already in use');
    const password_hash = await hashPassword(password);

    const desiredRoleId = roleToId(role);
    if (!desiredRoleId) throw badRequest('Invalid role');

    let status;
    if (desiredRoleId === 1) {
      if (!env.admin.registrationSecret) {
        throw unauthorized('Super Admin self-registration is disabled');
      }
      if (String(admin_registration_secret || '') !== String(env.admin.registrationSecret)) {
        throw unauthorized('Invalid Super Admin registration secret');
      }
      status = 'verified';
    }

    const user = await UserModel.create({
      first_name,
      last_name,
      email,
      password_hash,
      role_id: desiredRoleId,
      status,
    });
    return user;
  },
  async login({ email, password, role }) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw unauthorized('Invalid credentials');

    const requestedRoleId = roleToId(role);
    if (requestedRoleId && Number(user.role_id) !== requestedRoleId) {
      throw unauthorized('Role mismatch');
    }

    if (user?.status != 'verified') throw unauthorized('only verified users can login!');
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
    const allowed = ['pending', 'verified', 'disabled'];
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
