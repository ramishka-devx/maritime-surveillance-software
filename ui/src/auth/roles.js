export const Roles = {
  OPERATOR: 'operator',
  SUPER_ADMIN: 'super_admin',
};

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function isOperator(user) {
  return normalizeRole(user?.role) === Roles.OPERATOR;
}

export function isSuperAdmin(user) {
  return normalizeRole(user?.role) === Roles.SUPER_ADMIN;
}
