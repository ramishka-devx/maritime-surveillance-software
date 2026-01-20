import { PermissionModel } from './permission.model.js';

export const PermissionService = {
  create: (payload) => PermissionModel.create(payload),
  list: () => PermissionModel.list(),
  remove: (id) => PermissionModel.remove(id),
  assign: (role_id, permission_id) => PermissionModel.assign(role_id, permission_id),
  revoke: (role_id, permission_id) => PermissionModel.revoke(role_id, permission_id)
};
