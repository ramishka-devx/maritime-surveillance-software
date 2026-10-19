// Maintenance has explicit access to diagnostics, rather than permission grants.
export function isMaintenanceRole(role) {
  return String(typeof role === 'string' ? role : role?.name || '').trim().toLowerCase() === 'maintenance';
}

export function canMaintenanceAccess(method, originalUrl) {
  if (!['GET', 'HEAD'].includes(method)) return false;
  const path = originalUrl.split('?')[0].replace(/\/+$/, '').toLowerCase();
  // /me is needed to restore the signed-in session, not to expose a Profile page.
  return path === '/api/users/me'
    || isSystemHealthApi(path);
}

export function isSystemHealthApi(originalUrl) {
  const path = originalUrl.split('?')[0].replace(/\/+$/, '').toLowerCase();
  return /^\/api\/(?:system-health|systemhealth|system\/health)(?:\/|$)/.test(path);
}

export function isHealthPermission(permission) {
  return /^system[._-]health(?:[._-]|$)/i.test(String(permission));
}
