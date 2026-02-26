import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function safeParseUrl(value) {
  if (!value) return null;
  try {
    return new URL(String(value), 'http://local');
  } catch {
    return null;
  }
}

function inferActivityType(activity) {
  const name = activity?.permission?.name;
  const map = {
    'permissions.request_access': 'Access request',
    'permissions.create': 'Permission created',
    'permissions.update': 'Permission updated',
    'permissions.delete': 'Permission deleted',
    'roles.permissions.assign': 'Role permission assigned',
    'roles.permissions.revoke': 'Role permission revoked',
    'alerts.create': 'Alert created',
    'alerts.update': 'Alert updated',
    'alerts.assign': 'Alert assigned',
    'alerts.status': 'Alert status changed',
    'users.update': 'User updated',
    'users.verify': 'User status changed',
    'users.roles.assign': 'User role assigned',
    'users.roles.remove': 'User role removed',
    'users.roles.sync': 'User roles synced',
    'users.permissions.assign': 'User permission assigned',
    'users.permissions.revoke': 'User permission revoked',
    'vessels.create': 'Vessel created',
    'vessels.update': 'Vessel updated',
    'vessels.delete': 'Vessel deleted',
    'vessels.positions.create': 'Position recorded',
    'notifications.read': 'Notification read',
    'notifications.delete': 'Notification deleted',
  };
  if (name && map[name]) return map[name];

  const url = safeParseUrl(activity?.path);
  const pathname = url?.pathname || '';
  if (pathname === '/api/permissions/request-access') return 'Access request';

  const method = String(activity?.method || '').toUpperCase();
  if (method === 'POST') return 'Created/Submitted';
  if (method === 'PUT' || method === 'PATCH') return 'Updated';
  if (method === 'DELETE') return 'Deleted';
  if (method === 'GET') return 'Viewed';
  return 'Action';
}

function inferTouchedEntities(activity) {
  const url = safeParseUrl(activity?.path);
  const pathname = url?.pathname || '';
  const segments = pathname.split('/').filter(Boolean);

  const touches = [];

  const apiIndex = segments.indexOf('api');
  const afterApi = apiIndex >= 0 ? segments.slice(apiIndex + 1) : segments;

  const resource = afterApi[0];
  const resourceId = afterApi[1];

  const add = (label, id) => {
    const clean = String(id || '').trim();
    if (!clean) return;
    if (!/^\d+$/.test(clean)) return;
    touches.push(`${label} #${clean}`);
  };

  if (resource === 'alerts') add('Alert', resourceId);
  if (resource === 'users') add('User', resourceId);
  if (resource === 'vessels') add('Vessel', resourceId);
  if (resource === 'permissions') add('Permission', resourceId);
  if (resource === 'notifications') add('Notification', resourceId);
  if (resource === 'positions') add('Position', resourceId);

  // Highlight common query params when present.
  const params = url?.searchParams;
  if (params) {
    const q = (key) => {
      const v = params.get(key);
      return v ? String(v) : null;
    };

    const alertId = q('alert_id');
    const reportId = q('report_id');
    const userId = q('user_id');
    const vesselId = q('vessel_id');

    if (alertId) add('Alert', alertId);
    if (reportId) add('Report', reportId);
    if (userId) add('User', userId);
    if (vesselId) add('Vessel', vesselId);
  }

  // De-dupe while preserving order.
  return Array.from(new Set(touches));
}

function formatActivityDetails(activity) {
  const details = activity?.details;
  if (!details || typeof details !== 'object') return null;

  const parts = [];
  if (details.permission) parts.push(`Permission: ${details.permission}`);
  if (details.reason) parts.push(`Reason: ${details.reason}`);

  if (details.alert_id) parts.push(`Alert #${details.alert_id}`);
  if (details.status) parts.push(`Status: ${details.status}`);
  if (details.assigned_to) parts.push(`Assigned to: User #${details.assigned_to}`);

  if (details.user_id) parts.push(`User #${details.user_id}`);
  if (details.role_id) parts.push(`Role #${details.role_id}`);
  if (details.permission_id) parts.push(`Permission #${details.permission_id}`);

  if (details.vessel_id) parts.push(`Vessel #${details.vessel_id}`);

  if (parts.length > 0) return parts.join(' • ');

  try {
    const json = JSON.stringify(details);
    if (!json || json === '{}' || json === 'null') return null;
    return json;
  } catch {
    return null;
  }
}

function inferAdminAction(activity) {
  const status = Number(activity?.status_code);
  const isError = Number.isFinite(status) && status >= 400;

  const type = inferActivityType(activity);
  const details = activity?.details && typeof activity.details === 'object' ? activity.details : null;

  if (isError) {
    return { label: 'Investigate', to: null };
  }

  if (type === 'Access request') {
    return { label: 'Review & grant', to: '/permissions' };
  }

  if (String(type).startsWith('Alert')) {
    const alertId = details?.alert_id ? String(details.alert_id) : null;
    return { label: 'Open alert', to: alertId ? `/alerts/${alertId}` : '/alerts' };
  }

  if (String(type).startsWith('User') || String(type).startsWith('Role') || String(type).includes('permission')) {
    return { label: 'Audit access', to: '/permissions' };
  }

  if (String(type).startsWith('Vessel') || String(type).includes('Position')) {
    return { label: 'View on dashboard', to: '/' };
  }

  return { label: 'Review', to: null };
}

function formatWhen(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function OperatorActivityModal({ isOpen, operator, activities, loading, error, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const name = operator ? `${operator.first_name || ''} ${operator.last_name || ''}`.trim() : 'Operator';

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close activity window"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="absolute inset-0 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-[980px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
            <div>
              <div className="text-sm font-extrabold text-white">Operator activity</div>
              <div className="mt-0.5 text-[11px] font-semibold text-white/70">
                {name}{operator?.email ? ` • ${operator.email}` : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-extrabold text-white/85 hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-5">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="text-sm font-semibold text-white/70">Loading activity…</div>
            ) : null}

            {!loading && (!activities || activities.length === 0) ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-sm font-extrabold text-white">No activity found</div>
                <div className="mt-1 text-xs font-semibold text-white/60">
                  This operator has no recorded actions yet.
                </div>
              </div>
            ) : null}

            {!loading && activities && activities.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-12 gap-0 border-b border-white/10 bg-white/5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white/60">
                  <div className="col-span-3">When</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-4">Details</div>
                  <div className="col-span-2">Action</div>
                </div>

                {activities.map((a) => (
                  (() => {
                    const type = inferActivityType(a);
                    const explicitDetails = formatActivityDetails(a);
                    const touched = inferTouchedEntities(a);
                    const touchedLabel = touched.length > 0 ? touched.join(' • ') : null;
                    const details = explicitDetails || touchedLabel || '—';
                    const action = inferAdminAction(a);

                    return (
                  <div
                    key={a.activity_id}
                    className="grid grid-cols-12 gap-0 border-b border-white/5 px-3 py-2 text-[11px] font-semibold text-white/85"
                  >
                    <div className="col-span-3 pr-2 text-white/70">{formatWhen(a.created_at)}</div>
                    <div className="col-span-3 pr-2">
                      <div className="truncate">{type}</div>
                    </div>
                    <div className="col-span-4 pr-2 truncate" title={typeof details === 'string' ? details : undefined}>
                      {details}
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-extrabold text-white/85 hover:bg-white/10 transition disabled:opacity-60"
                        disabled={!action?.to}
                        title={action?.to ? `Go to ${action.to}` : undefined}
                        onClick={() => {
                          if (!action?.to) return;
                          navigate(action.to);
                          onClose?.();
                        }}
                      >
                        {action?.label || 'Review'}
                      </button>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
