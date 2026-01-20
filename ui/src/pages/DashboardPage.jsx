import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { isOperator, isSuperAdmin } from '../auth/roles.js';

function Section({ title, children, right }) {
  return (
    <section className="border rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const operator = isOperator(user);

  const [vessels, setVessels] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');

  const roleLabel = useMemo(() => user?.role || user?.role_id || 'unknown', [user]);

  async function refresh() {
    setError('');
    try {
      const [v, a] = await Promise.all([
        apiRequest('/api/vessels?page=1&limit=5', { token }),
        apiRequest('/api/alerts?page=1&limit=5', { token }),
      ]);
      setVessels(v);
      setAlerts(a);
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard data');
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">Dashboard</div>
        <div className="mt-1 text-sm text-slate-600">
          Signed in as <span className="font-medium">{roleLabel}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
          <div className="mt-1 text-xs text-amber-700">
            If the backend isn’t running yet or DB creds aren’t set, this is expected.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section
          title="Vessels"
          right={
            <button
              className="text-xs rounded-md bg-slate-900 text-white px-2 py-1 hover:bg-slate-800"
              onClick={refresh}
              type="button"
            >
              Refresh
            </button>
          }
        >
          {vessels?.rows?.length ? (
            <ul className="space-y-1">
              {vessels.rows.map((v) => (
                <li key={v.vessel_id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{v.name || 'Unnamed vessel'}</div>
                    <div className="text-xs text-slate-500">MMSI: {v.mmsi}</div>
                  </div>
                  <div className="text-xs text-slate-500">{v.status}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-600">No vessels loaded.</div>
          )}

          {superAdmin && (
            <div className="mt-3 text-xs text-slate-600">
              Super Admin feature: create/update/delete vessels (API: <span className="font-mono">/api/vessels</span>).
            </div>
          )}
        </Section>

        <Section title="Alerts">
          {alerts?.rows?.length ? (
            <ul className="space-y-2">
              {alerts.rows.map((a) => (
                <li key={a.alert_id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.severity} • {a.status}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Vessel: {a.vessel_name || a.mmsi || 'n/a'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-600">No alerts loaded.</div>
          )}

          {operator && (
            <div className="mt-3 text-xs text-slate-600">
              Operator feature: acknowledge/resolve alerts (API: <span className="font-mono">PUT /api/alerts/:id/status</span>).
            </div>
          )}

          {superAdmin && (
            <div className="mt-2 text-xs text-slate-600">
              Super Admin feature: assign alerts (API: <span className="font-mono">PUT /api/alerts/:id/assign</span>).
            </div>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Operator console (shown to operator)">
          {operator ? (
            <div className="space-y-2">
              <div>• Add positions for vessels</div>
              <div className="text-xs text-slate-500 font-mono">POST /api/vessels/:vessel_id/positions</div>
              <div>• Triage alerts (acknowledge/resolve)</div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">Hidden (not operator).</div>
          )}
        </Section>

        <Section title="Admin features (shown to super_admin)">
          {superAdmin ? (
            <div className="space-y-2">
              <div>• Manage users (verify/disable, role changes)</div>
              <div className="text-xs text-slate-500 font-mono">/api/users</div>
              <div>• Manage roles/permissions</div>
              <div className="text-xs text-slate-500 font-mono">/api/roles • /api/permissions</div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">Hidden (not super admin).</div>
          )}
        </Section>
      </div>
    </div>
  );
}
