// Plain labels and groups for permission names, shared by Roles & access and My profile.
import { roleLabel } from '../auth/roles.js';

// Seeded permissions, labelled from the routes each one guards.
const LABELS = {
  'dashboard.view': 'View map, dashboard and vessels',
  'alert.view': 'View alerts',
  'alert.status.view': 'Manage alerts (create, assign, change status)',
  'reports.view': 'Open reports',
  'report.download': 'Download reports',
  'users.list': 'List users',
  'users.view': 'View user details',
  'user.status.update': 'Edit users and activate or deactivate them',
};
const GROUPS = { dashboard: 'Map & dashboard', alert: 'Alerts', report: 'Reports', user: 'Users', role: 'Roles' };
const ORDER = Object.keys(GROUPS);

const nameOf = (p) => (typeof p === 'string' ? p : p.name);
const singular = (s) => s.replace(/ies$/, 'y').replace(/s$/, '');

export const permissionLabel = (p) =>
  LABELS[nameOf(p)] || p.description || roleLabel(nameOf(p).split('.').slice(1).join(' ') || nameOf(p));

// [{ key, title, perms }] in a stable order; `perms` are the input items (strings or rows).
export function groupPermissions(perms) {
  const map = new Map();
  for (const p of perms) {
    const key = singular(String(p.module || nameOf(p).split('.')[0] || 'other').toLowerCase());
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  const rank = (k) => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length);
  return [...map.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      title: GROUPS[key] || roleLabel(key),
      perms: [...list].sort((a, b) => permissionLabel(a).localeCompare(permissionLabel(b))),
    }));
}
