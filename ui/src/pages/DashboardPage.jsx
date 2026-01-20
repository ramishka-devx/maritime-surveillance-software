import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { isOperator, isSuperAdmin } from '../auth/roles.js';

function SectionShell({ title, right, children }) {
  return (
    <div className="bg-[#1a2942] rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const s = String(status || '').toLowerCase();
  const cls =
    s === 'verified'
      ? 'bg-green-500/10 text-green-300 border-green-500/30'
      : s === 'pending'
        ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
        : 'bg-red-500/10 text-red-300 border-red-500/30';
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded border ${cls}`}>{status || 'unknown'}</span>
  );
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const operator = isOperator(user);

  const [vessels, setVessels] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [users, setUsers] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState('');

  const [selectedOperatorUser, setSelectedOperatorUser] = useState(null);
  const [selectedOperatorPermissions, setSelectedOperatorPermissions] = useState(null);
  const [operatorPermsBusy, setOperatorPermsBusy] = useState(false);

  const [error, setError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);

  const stats = useMemo(() => {
    const activeVessels = vessels?.total ?? '—';
    const activeAlerts = alerts?.total ?? '—';
    const zonesMonitored = '15';
    const systemStatus = '98%';

    return [
      { title: 'Active Vessels', value: String(activeVessels), change: '', icon: '⚓', color: '#088395' },
      { title: 'Active Alerts', value: String(activeAlerts), change: '', icon: '⚠️', color: '#f59e0b' },
      { title: 'Zones Monitored', value: String(zonesMonitored), change: '0', icon: '🗺️', color: '#10b981' },
      { title: 'System Status', value: String(systemStatus), change: '+2%', icon: '✓', color: '#0a4d68' },
    ];
  }, [vessels, alerts]);

  const recentActivity = useMemo(() => {
    const rows = alerts?.rows || [];
    if (!rows.length) {
      return [
        { id: 1, vessel: 'MV Ocean Star', type: 'Entry', zone: 'Zone A-1', time: '2 mins ago', status: 'normal' },
        { id: 2, vessel: 'SS Neptune', type: 'Alert', zone: 'Zone B-3', time: '15 mins ago', status: 'warning' },
        { id: 3, vessel: 'HMS Guardian', type: 'Exit', zone: 'Zone A-2', time: '32 mins ago', status: 'normal' },
      ];
    }

    return rows.slice(0, 6).map((a) => ({
      id: a.alert_id,
      vessel: a.vessel_name || a.name || a.mmsi || 'Unknown vessel',
      type: String(a.type || 'Alert'),
      zone: '—',
      time: a.created_at ? new Date(a.created_at).toLocaleString() : 'Recently',
      status: a.severity === 'critical' || a.severity === 'high' ? 'critical' : a.severity === 'medium' ? 'warning' : 'normal',
    }));
  }, [alerts]);

  const vesselsByZone = useMemo(
    () => [
      { zone: 'Zone A', vessels: 67, percentage: 27 },
      { zone: 'Zone B', vessels: 89, percentage: 36 },
      { zone: 'Zone C', vessels: 54, percentage: 22 },
      { zone: 'Zone D', vessels: 38, percentage: 15 },
    ],
    []
  );

  async function fetchAllUsers() {
    const pageSize = 200;
    let page = 1;
    let total = 0;
    const allRows = [];

    // Hard cap to prevent accidental infinite loops if API lies about `total`.
    const maxPages = 100;

    while (page <= maxPages) {
      // eslint-disable-next-line no-await-in-loop
      const chunk = await apiRequest(`/api/users?page=${page}&limit=${pageSize}`, { token });
      const rows = Array.isArray(chunk?.rows) ? chunk.rows : [];

      if (page === 1) {
        total = Number(chunk?.total || 0);
      }

      allRows.push(...rows);

      if (rows.length < pageSize) break;
      if (total && allRows.length >= total) break;
      page += 1;
    }

    return { rows: allRows, total: total || allRows.length };
  }

  async function refresh() {
    setError('');
    setAdminMessage('');

    try {
      const [v, a] = await Promise.all([
        apiRequest('/api/vessels?page=1&limit=1', { token }),
        apiRequest('/api/alerts?page=1&limit=5', { token }),
      ]);
      setVessels(v);
      setAlerts(a);
    } catch (e) {
      setError(e?.message || 'Failed to load dashboard data');
    }

    if (superAdmin) {
      try {
        const [u, p] = await Promise.all([
          fetchAllUsers(),
          apiRequest('/api/permissions', { token }),
        ]);
        setUsers(u);
        setPermissions(p);
      } catch (e) {
        setError(e?.message || 'Failed to load admin data');
      }
    }
  }

  async function loadOperatorPermissions(userId) {
    setOperatorPermsBusy(true);
    setSelectedOperatorPermissions(null);
    setError('');
    try {
      const rows = await apiRequest(`/api/users/${userId}/permissions`, { token });
      setSelectedOperatorPermissions(rows);
    } catch (e) {
      setError(e?.message || 'Failed to load user permissions');
    } finally {
      setOperatorPermsBusy(false);
    }
  }

  async function setPermissionForOperatorUser(userId, permissionId, nextAssigned) {
    setOperatorPermsBusy(true);
    setAdminMessage('');
    setError('');
    try {
      const endpoint = nextAssigned
        ? `/api/users/${userId}/permissions/assign`
        : `/api/users/${userId}/permissions/revoke`;
      await apiRequest(endpoint, {
        token,
        method: 'POST',
        body: { permission_id: Number(permissionId) },
      });
      setAdminMessage(nextAssigned ? 'Permission granted to operator account' : 'Permission revoked from operator account');
      await loadOperatorPermissions(userId);
    } catch (e) {
      setError(e?.message || 'Failed to update user permission');
    } finally {
      setOperatorPermsBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superAdmin]);

  async function updateUserStatus(userId, status) {
    setAdminBusy(true);
    setAdminMessage('');
    setError('');
    try {
      await apiRequest(`/api/users/${userId}/status`, {
        token,
        method: 'PUT',
        body: { status },
      });
      setAdminMessage(`Updated user status → ${status}`);
      await refresh();
    } catch (e) {
      setError(e?.message || 'Failed to update user status');
    } finally {
      setAdminBusy(false);
    }
  }

  async function assignPermissionToOperator(permissionId) {
    if (!permissionId) return;
    setAdminBusy(true);
    setAdminMessage('');
    setError('');
    try {
      await apiRequest('/api/permissions/assign', {
        token,
        method: 'POST',
        body: { role_id: 2, permission_id: Number(permissionId) },
      });
      setAdminMessage('Granted permission to operator role');
    } catch (e) {
      setError(e?.message || 'Failed to assign permission');
    } finally {
      setAdminBusy(false);
    }
  }

  async function revokePermissionFromOperator(permissionId) {
    if (!permissionId) return;
    setAdminBusy(true);
    setAdminMessage('');
    setError('');
    try {
      await apiRequest('/api/permissions/revoke', {
        token,
        method: 'POST',
        body: { role_id: 2, permission_id: Number(permissionId) },
      });
      setAdminMessage('Revoked permission from operator role');
    } catch (e) {
      setError(e?.message || 'Failed to revoke permission');
    } finally {
      setAdminBusy(false);
    }
  }

  async function grantAllPermissionsToOperator() {
    const list = permissions || [];
    if (!list.length) return;

    setAdminBusy(true);
    setAdminMessage('');
    setError('');

    try {
      for (const p of list) {
        // eslint-disable-next-line no-await-in-loop
        await apiRequest('/api/permissions/assign', {
          token,
          method: 'POST',
          body: { role_id: 2, permission_id: Number(p.permission_id) },
        });
      }
      setAdminMessage(`Granted ${list.length} permissions to operator role`);
    } catch (e) {
      setError(e?.message || 'Failed to grant all permissions');
    } finally {
      setAdminBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e] p-8 animate-fadeIn">
      <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Maritime Surveillance Dashboard</h1>
          <p className="text-lg text-gray-400">Real-time monitoring and analytics</p>
          {user && (
            <div className="mt-2 text-sm text-gray-400">
              Signed in as <span className="text-white font-semibold">{user.role || `role_id:${user.role_id}`}</span>
            </div>
          )}
        </div>

        <button
          onClick={refresh}
          type="button"
          className="text-sm font-semibold text-gray-300 px-4 py-2 border border-gray-600 rounded-lg hover:bg-[#243b78] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {adminMessage && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {adminMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-[#1a2942] rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-gray-700"
            style={{ borderLeftColor: stat.color }}
          >
            <div className="text-4xl mb-4">{stat.icon}</div>
            <p className="text-sm text-gray-400 font-semibold mb-2">{stat.title}</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
              {stat.change ? (
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded ${
                    stat.change.startsWith('+')
                      ? 'bg-green-500/10 text-green-400'
                      : stat.change.startsWith('-')
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {stat.change}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionShell
          title="Recent Activity"
          right={
            <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 p-3 bg-[#0b1220] rounded-xl hover:bg-[#111b2e] transition-colors border border-gray-800"
              >
                <div
                  className={`w-1.5 rounded-full flex-shrink-0 ${
                    activity.status === 'normal'
                      ? 'bg-green-500'
                      : activity.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white truncate">{activity.vessel}</span>
                    <span className="text-xs bg-[#243b78] text-blue-200 px-2 py-0.5 rounded font-semibold">
                      {activity.type}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>{activity.zone}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="Vessel Distribution"
          right={
            <button
              className="text-xs font-semibold text-[#f28c1b] hover:text-orange-400 px-3 py-1.5 border border-[#f28c1b]/30 rounded-lg transition-colors"
              type="button"
            >
              View All
            </button>
          }
        >
          <div className="flex flex-col gap-4">
            {vesselsByZone.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-200">{item.zone}</span>
                  <span className="text-sm text-gray-400">{item.vessels} vessels</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 font-medium">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </SectionShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionShell
          title="Operator Console"
          right={
            operator ? (
              <span className="text-xs font-semibold text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg">
                Enabled
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-300 bg-gray-500/10 border border-gray-500/20 px-3 py-1 rounded-lg">
                Read-only
              </span>
            )
          }
        >
          {operator ? (
            <div className="space-y-3 text-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Triage alerts</div>
                  <div className="text-xs text-gray-400">Acknowledge/resolve incoming alerts</div>
                </div>
                <div className="text-xs text-gray-400 font-mono">PUT /api/alerts/:id/status</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Track vessels</div>
                  <div className="text-xs text-gray-400">View active vessels and latest positions</div>
                </div>
                <div className="text-xs text-gray-400 font-mono">GET /api/vessels</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">This section is for operators.</div>
          )}
        </SectionShell>

        <SectionShell
          title="Super Admin Control Center"
          right={
            superAdmin ? (
              <span className="text-xs font-semibold text-[#f28c1b] border border-[#f28c1b]/30 bg-[#f28c1b]/10 px-3 py-1 rounded-lg">
                Super Admin
              </span>
            ) : null
          }
        >
          {superAdmin ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-300">
                Usual controls: manage users, enable/disable access, and grant operators additional permissions.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-700 bg-[#0b1220] p-4">
                  <div className="text-sm font-bold text-white mb-2">Grant Operator Feature Access</div>
                  <div className="text-xs text-gray-400 mb-3">
                    Assign a permission to the <span className="font-semibold text-gray-200">operator</span> role.
                  </div>

                  <select
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#f28c1b] focus:ring-2 focus:ring-[#f28c1b]/30"
                    value={selectedPermissionId}
                    onChange={(e) => setSelectedPermissionId(e.target.value)}
                    disabled={adminBusy}
                  >
                    <option value="">Select permission…</option>
                    {(permissions || []).map((p) => (
                      <option key={p.permission_id} value={p.permission_id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={adminBusy || !selectedPermissionId}
                      onClick={() => assignPermissionToOperator(selectedPermissionId)}
                      className="px-3 py-2 text-sm font-semibold bg-[#f28c1b] text-white rounded-lg hover:bg-[#d97706] transition-all duration-300 disabled:opacity-60"
                    >
                      Grant
                    </button>
                    <button
                      type="button"
                      disabled={adminBusy || !selectedPermissionId}
                      onClick={() => revokePermissionFromOperator(selectedPermissionId)}
                      className="px-3 py-2 text-sm font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 disabled:opacity-60"
                    >
                      Revoke
                    </button>
                    <button
                      type="button"
                      disabled={adminBusy || !(permissions || []).length}
                      onClick={grantAllPermissionsToOperator}
                      className="px-3 py-2 text-sm font-semibold border border-[#f28c1b]/30 text-[#f28c1b] rounded-lg hover:text-orange-400 hover:border-orange-400 transition-all duration-300 disabled:opacity-60"
                    >
                      Grant All
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700 bg-[#0b1220] p-4">
                  <div className="text-sm font-bold text-white mb-2">Operators</div>
                  <div className="text-xs text-gray-400 mb-3">View all operator accounts, then click one to manage permissions.</div>

                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {(users?.rows || [])
                      .filter((u) => String(u.role || '').toLowerCase() === 'operator' || Number(u.role_id) === 2)
                      .map((u) => (
                        <div
                          key={u.user_id}
                          className={`flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#111b2e] px-3 py-2 hover:bg-[#162341] cursor-pointer ${
                            selectedOperatorUser?.user_id === u.user_id ? 'ring-2 ring-[#f28c1b]/40' : ''
                          }`}
                          onClick={() => {
                            setSelectedOperatorUser(u);
                            loadOperatorPermissions(u.user_id);
                          }}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{u.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill status={u.status} />
                            <button
                              type="button"
                              disabled={adminBusy}
                              onClick={() => updateUserStatus(u.user_id, 'verified')}
                              className="text-xs font-semibold text-green-300 border border-green-500/30 bg-green-500/10 px-2 py-1 rounded hover:bg-green-500/20 disabled:opacity-60"
                            >
                              Grant Access
                            </button>
                            <button
                              type="button"
                              disabled={adminBusy}
                              onClick={() => updateUserStatus(u.user_id, 'disabled')}
                              className="text-xs font-semibold text-red-300 border border-red-500/30 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20 disabled:opacity-60"
                            >
                              Disable
                            </button>
                          </div>
                        </div>
                      ))}
                    {users?.rows?.length === 0 ? (
                      <div className="text-sm text-gray-400">No users found.</div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-700 bg-[#0b1220] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">Manage Operator Permissions</div>
                        <div className="text-xs text-gray-400">
                          {selectedOperatorUser
                            ? `Selected: ${selectedOperatorUser.first_name} ${selectedOperatorUser.last_name} (${selectedOperatorUser.email})`
                            : 'Select an operator from the list above.'}
                        </div>
                      </div>
                      {selectedOperatorUser ? (
                        <button
                          type="button"
                          onClick={() => loadOperatorPermissions(selectedOperatorUser.user_id)}
                          disabled={operatorPermsBusy}
                          className="text-xs font-semibold text-gray-300 px-3 py-2 border border-gray-600 rounded-lg hover:bg-[#243b78] transition-colors disabled:opacity-60"
                        >
                          Refresh
                        </button>
                      ) : null}
                    </div>

                    {selectedOperatorUser ? (
                      <div className="mt-3 max-h-64 overflow-auto pr-1 space-y-2">
                        {operatorPermsBusy && !selectedOperatorPermissions ? (
                          <div className="text-sm text-gray-400">Loading permissions…</div>
                        ) : null}

                        {(selectedOperatorPermissions || []).map((p) => {
                          const assigned = Number(p.assigned) === 1;
                          return (
                            <div
                              key={p.permission_id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#111b2e] px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                                {p.description ? <div className="text-xs text-gray-400 truncate">{p.description}</div> : null}
                              </div>
                              <button
                                type="button"
                                disabled={operatorPermsBusy}
                                onClick={() => setPermissionForOperatorUser(selectedOperatorUser.user_id, Number(p.permission_id), !assigned)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                                  assigned
                                    ? 'text-red-200 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                                    : 'text-green-200 border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                                }`}
                              >
                                {assigned ? 'Revoke' : 'Grant'}
                              </button>
                            </div>
                          );
                        })}

                        {selectedOperatorPermissions && selectedOperatorPermissions.length === 0 ? (
                          <div className="text-sm text-gray-400">No permissions found.</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-gray-400">Pick an operator to view and update permissions.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Admin controls are available to Super Admin only.
            </div>
          )}
        </SectionShell>
      </div>

      <SectionShell
        title="Surveillance Map"
        right={
          <div className="flex gap-2">
            <button className="text-sm font-semibold text-gray-300 px-3 py-2 border border-gray-600 rounded-lg hover:bg-[#243b78] transition-colors" type="button">
              Refresh
            </button>
            <button className="text-sm font-semibold text-gray-300 px-3 py-2 border border-gray-600 rounded-lg hover:bg-[#243b78] transition-colors" type="button">
              Fullscreen
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-16 bg-[#0b1220] rounded-xl border-2 border-dashed border-gray-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-gray-600 mb-3"
          >
            <path
              d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="8"
              y1="2"
              x2="8"
              y2="18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="16"
              y1="6"
              x2="16"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-lg font-semibold text-gray-400 mb-1">Interactive Map View</p>
          <span className="text-sm text-gray-500">Showing {String(vessels?.total ?? 248)} active vessels across 15 monitored zones</span>
        </div>
      </SectionShell>
    </div>
  );
}
