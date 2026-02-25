import { PermissionModel } from './permission.model.js';
import { notFound, badRequest } from '../../utils/errorHandler.js';
import { query } from '../../config/db.config.js';
import { NotificationService } from '../notifications/notification.service.js';

export const PermissionService = {
  async create(payload) {
    const { name } = payload;
    
    // Check if permission name already exists
    const exists = await PermissionModel.checkNameExists(name);
    if (exists) {
      throw badRequest('Permission name already exists');
    }
    
    return PermissionModel.create(payload);
  },

  async list(params = {}) {
    return PermissionModel.list(params);
  },

  async listAll() {
    return PermissionModel.listAll();
  },

  async listByModule() {
    return PermissionModel.listByModule();
  },

  async getModules() {
    return PermissionModel.getModules();
  },

  async getById(permission_id) {
    const permission = await PermissionModel.findById(permission_id);
    if (!permission) throw notFound('Permission not found');
    return permission;
  },

  async getByName(name) {
    const permission = await PermissionModel.findByName(name);
    if (!permission) throw notFound('Permission not found');
    return permission;
  },

  async update(permission_id, data) {
    const existing = await PermissionModel.findById(permission_id);
    if (!existing) throw notFound('Permission not found');
    
    if (data.name && data.name !== existing.name) {
      const nameExists = await PermissionModel.checkNameExists(data.name, permission_id);
      if (nameExists) {
        throw badRequest('Permission name already exists');
      }
    }
    
    return PermissionModel.update(permission_id, data);
  },

  async remove(permission_id) {
    const existing = await PermissionModel.findById(permission_id);
    if (!existing) throw notFound('Permission not found');
    
    await PermissionModel.remove(permission_id);
    return { message: 'Permission deactivated successfully' };
  },

  async getRolesWithPermission(permission_id) {
    const existing = await PermissionModel.findById(permission_id);
    if (!existing) throw notFound('Permission not found');
    
    return PermissionModel.getRolesWithPermission(permission_id);
  },

  async requestAccess({ requesterUserId, permissionName, reason = '' }) {
    const userId = Number(requesterUserId);
    if (!userId || Number.isNaN(userId)) {
      throw badRequest('Invalid requester');
    }

    const rawPermission = String(permissionName || '').trim();
    if (!rawPermission) {
      throw badRequest('Permission name is required');
    }

    const permission = await PermissionModel.findByName(rawPermission);
    if (!permission || !Number(permission.is_active)) {
      throw notFound('Permission not found');
    }

    const [requester] = await query(
      'SELECT user_id, username, email, first_name, last_name FROM users WHERE user_id = ? LIMIT 1',
      [userId],
    );

    const requesterLabel = requester
      ? [requester.first_name, requester.last_name].filter(Boolean).join(' ').trim() || requester.username || requester.email
      : `User #${userId}`;

    const admins = await query(
      `SELECT DISTINCT u.user_id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
       WHERE r.name = 'super_admin'`,
    );

    const adminIds = (admins || [])
      .map((a) => Number(a.user_id))
      .filter((id) => id && !Number.isNaN(id) && id !== userId);

    const cleanedReason = String(reason || '').trim();
    const message = [
      `User: ${requesterLabel}`,
      requester?.email ? `Email: ${requester.email}` : null,
      `Requested permission: ${rawPermission}`,
      cleanedReason ? `Reason: ${cleanedReason}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const title = `Permission request: ${rawPermission}`;

    let notified = 0;
    for (const adminId of adminIds) {
      // Create as a notification; email is best-effort.
      await NotificationService.createNotification(
        adminId,
        'permission_request',
        title,
        message,
        'permission_request',
        null,
        'medium',
      );
      notified += 1;
    }

    return {
      permission: rawPermission,
      requester_user_id: userId,
      notified_admins: notified,
    };
  },

  // Legacy methods for backward compatibility
  assign: (role_id, permission_id) => PermissionModel.assign(role_id, permission_id),
  revoke: (role_id, permission_id) => PermissionModel.revoke(role_id, permission_id)
};
