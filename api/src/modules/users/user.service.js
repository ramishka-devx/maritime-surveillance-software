import { UserModel, hashPassword, comparePassword } from './user.model.js';
import { badRequest, unauthorized, notFound } from '../../utils/errorHandler.js';
import { signToken } from '../../utils/jwtHelper.js';
import { query } from '../../config/db.config.js';
import { getUserPermissions, getUserRoles, buildAuthPayload } from '../../utils/permissionHelper.js';

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
    
    // Get user's roles and permissions for the response
    const authPayload = await buildAuthPayload(user.user_id);
    
    const token = signToken({ 
      user_id: user.user_id, 
      role_id: user.role_id, 
      email: user.email 
    });
    
    return { 
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        status: user.status,
        profileImg: user.profileImg
      },
      roles: authPayload.roles,
      permissions: authPayload.permissions
    };
  },

  async getProfile(user_id) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    
    // Include roles and permissions in profile
    const authPayload = await buildAuthPayload(user_id);
    
    return {
      ...user,
      roles: authPayload.roles,
      permissions: authPayload.permissions
    };
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

  // ==========================================
  // Multi-Role Management
  // ==========================================

  async getUserRoles(user_id) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    return UserModel.getUserRoles(user_id);
  },

  async assignRoleToUser(user_id, role_id, assigned_by = null) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    
    // Verify role exists
    const [role] = await query('SELECT role_id FROM roles WHERE role_id = ? AND is_active = 1', [role_id]);
    if (!role) throw badRequest('Role not found');
    
    await UserModel.assignRole(user_id, role_id, assigned_by);
    return { user_id, role_id, message: 'Role assigned' };
  },

  async removeRoleFromUser(user_id, role_id) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    
    // Ensure user keeps at least one role
    const currentRoles = await UserModel.getUserRoles(user_id);
    if (currentRoles.length <= 1) {
      throw badRequest('User must have at least one role');
    }
    
    await UserModel.removeRole(user_id, role_id);
    return { user_id, role_id, message: 'Role removed' };
  },

  async syncUserRoles(user_id, role_ids, assigned_by = null) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    
    if (!role_ids || role_ids.length === 0) {
      throw badRequest('User must have at least one role');
    }
    
    // Validate all role IDs exist
    const placeholders = role_ids.map(() => '?').join(', ');
    const validRoles = await query(
      `SELECT role_id FROM roles WHERE role_id IN (${placeholders}) AND is_active = 1`,
      role_ids
    );
    
    if (validRoles.length !== role_ids.length) {
      throw badRequest('One or more roles are invalid');
    }
    
    await UserModel.syncRoles(user_id, role_ids, assigned_by);
    return { user_id, role_count: role_ids.length, message: 'Roles synchronized' };
  },

  // ==========================================
  // Direct Permission Management
  // ==========================================

  async listPermissionsForUser(target_user_id) {
    const target = await UserModel.findById(target_user_id);
    if (!target) throw notFound('User not found');
    return UserModel.listPermissionsWithAssignment(target_user_id);
  },

  async getDirectPermissions(user_id) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    return UserModel.getDirectPermissions(user_id);
  },

  async getEffectivePermissions(user_id) {
    const user = await UserModel.findById(user_id);
    if (!user) throw notFound('User not found');
    return getUserPermissions(user_id);
  },

  async assignPermissionToUser(target_user_id, permission_id) {
    if (!Number.isInteger(permission_id)) throw badRequest('Invalid permission id');
    const target = await UserModel.findById(target_user_id);
    if (!target) throw notFound('User not found');

    const perm = await query('SELECT permission_id FROM permissions WHERE permission_id = ? AND is_active = 1 LIMIT 1', [permission_id]);
    if (!perm.length) throw badRequest('Permission not found');

    await UserModel.assignUserPermission(target_user_id, permission_id);
    return { user_id: target_user_id, permission_id };
  },

  async revokePermissionFromUser(target_user_id, permission_id) {
    if (!Number.isInteger(permission_id)) throw badRequest('Invalid permission id');
    const target = await UserModel.findById(target_user_id);
    if (!target) throw notFound('User not found');

    await UserModel.revokeUserPermission(target_user_id, permission_id);
    return { user_id: target_user_id, permission_id };
  }
};
