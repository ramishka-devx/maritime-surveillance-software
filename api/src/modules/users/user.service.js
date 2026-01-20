import { UserModel, hashPassword, comparePassword } from './user.model.js';
import { badRequest, unauthorized, notFound } from '../../utils/errorHandler.js';
import { signToken } from '../../utils/jwtHelper.js';
import { query } from '../../config/db.config.js';

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function roleToId(role) {
  const r = normalizeRole(role);
  if (!r) return null;
  if (r === 'operator') return 2;
  if (r === 'super_admin') return 1;
  return null;
}

export const UserService = {
  async register({ first_name, last_name, username, email, password, role, admin_registration_secret }) {
    if (normalizeRole(role) === 'super_admin') {
      throw unauthorized('Super Admin accounts cannot be self-registered');
    }

    const emailExists = await UserModel.findByEmail(email);
    if (emailExists) throw badRequest('Email already in use');

    const usernameExists = await UserModel.findByUsername(username);
    if (usernameExists) throw badRequest('Username already in use');

    const password_hash = await hashPassword(password);

    const desiredRoleId = 2; // operator
    void admin_registration_secret;
    const status = 'verified';

    const user = await UserModel.create({
      first_name,
      last_name,
      username,
      email,
      password_hash,
      role_id: desiredRoleId,
      status,
    });
    return user;
  },
  async login({ identifier, password, role }) {
    const user = await UserModel.findByIdentifier(identifier);
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
  },
  async listPermissionsForUser(target_user_id) {
    const target = await UserModel.findById(target_user_id);
    if (!target) throw notFound('User not found');
    if (Number(target.role_id) === 1) throw badRequest('Cannot manage permissions for Super Admin');
    return UserModel.listPermissionsWithAssignment(target_user_id);
  },
  async assignPermissionToUser(target_user_id, permission_id) {
    if (!Number.isInteger(permission_id)) throw badRequest('Invalid permission id');
    const target = await UserModel.findById(target_user_id);
    if (!target) throw notFound('User not found');
    if (Number(target.role_id) === 1) throw badRequest('Cannot manage permissions for Super Admin');

    const perm = await query('SELECT permission_id FROM permissions WHERE permission_id = ? LIMIT 1', [permission_id]);
    if (!perm.length) throw badRequest('Permission not found');

    await UserModel.assignUserPermission(target_user_id, permission_id);
    return { user_id: target_user_id, permission_id };
  },
  async revokePermissionFromUser(target_user_id, permission_id) {
    if (!Number.isInteger(permission_id)) throw badRequest('Invalid permission id');
    const target = await UserModel.findById(target_user_id);
    if (!target) throw notFound('User not found');
    if (Number(target.role_id) === 1) throw badRequest('Cannot manage permissions for Super Admin');

    await UserModel.revokeUserPermission(target_user_id, permission_id);
    return { user_id: target_user_id, permission_id };
  }
};
