export const Roles = {
  OPERATOR: 'operator',
  SUPER_ADMIN: 'super_admin',
};

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function isOperator(user) {
  if (normalizeRole(user?.role) === Roles.OPERATOR) return true;
  return Number(user?.role_id) === 2;
}

export function isSuperAdmin(user) {
  if (normalizeRole(user?.role) === Roles.SUPER_ADMIN) return true;
  return Number(user?.role_id) === 1;
}
