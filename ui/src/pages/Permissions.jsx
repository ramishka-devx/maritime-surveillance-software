import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Permissions() {
  const { token, isSuperAdmin } = useAuth();
  const canAdmin = isSuperAdmin();

  const [adminUsers, setAdminUsers] = useState(null);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');

  const [operatorPermissions, setOperatorPermissions] = useState(null);
  const [operatorPermsLoading, setOperatorPermsLoading] = useState(false);
  const [operatorPermsError, setOperatorPermsError] = useState('');
  const [permBusyId, setPermBusyId] = useState(null);

  const operators = useMemo(() => {
    const rows = Array.isArray(adminUsers?.rows) ? adminUsers.rows : [];
    return rows
      .filter((u) => String(u.role || '').toLowerCase() === 'operator' || Number(u.role_id) === 2)
      .sort((a, b) => {
        const an = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        const bn = `${b.first_name || ''} ${b.last_name || ''}`.trim();
        return an.localeCompare(bn);
      });
  }, [adminUsers]);

  const selectedOperator = useMemo(() => {
    if (!selectedOperatorId) return null;
    return operators.find((u) => String(u.user_id) === String(selectedOperatorId)) || null;
  }, [operators, selectedOperatorId]);

  useEffect(() => {
    if (!canAdmin) return;
    if (!token) return;
    if (adminUsers) return;

    let cancelled = false;
    setAdminUsersLoading(true);
    setAdminUsersError('');

    (async () => {
      try {
        const data = await apiRequest('/api/users?page=1&limit=200', { token });
        if (!cancelled) setAdminUsers(data);
      } catch (e) {
        if (!cancelled) setAdminUsersError(e?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setAdminUsersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adminUsers, adminUsersLoading, canAdmin, token]);

  useEffect(() => {
    if (!canAdmin) return;
    if (!token) return;
    if (!selectedOperatorId) {
      setOperatorPermissions(null);
      setOperatorPermsError('');
      return;
    }

    let cancelled = false;
    setOperatorPermsLoading(true);
    setOperatorPermsError('');

    (async () => {
      try {
        const data = await apiRequest(`/api/users/${selectedOperatorId}/permissions`, { token });
        if (!cancelled) setOperatorPermissions(data);
      } catch (e) {
        if (!cancelled) setOperatorPermsError(e?.message || 'Failed to load permissions');
      } finally {
        if (!cancelled) setOperatorPermsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canAdmin, selectedOperatorId, token]);

  const operatorPermsByModule = useMemo(() => {
    const rows = Array.isArray(operatorPermissions) ? operatorPermissions : [];
    const grouped = {};
    for (const p of rows) {
      const module = p.module || 'other';
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(p);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, perms]) => ({
        module,
        perms: perms.sort((x, y) => String(x.name || '').localeCompare(String(y.name || ''))),
      }));
  }, [operatorPermissions]);

  async function togglePermission(permission) {
    if (!canAdmin) return;
    if (!token) return;
    if (!selectedOperatorId) return;

    const permId = Number(permission?.permission_id);
    if (!Number.isFinite(permId)) return;

    const currentlyAssigned = Number(permission?.assigned) === 1;
    const endpoint = currentlyAssigned
      ? `/api/users/${selectedOperatorId}/permissions/revoke`
      : `/api/users/${selectedOperatorId}/permissions/assign`;

    setPermBusyId(permId);
    setOperatorPermsError('');

    try {
      await apiRequest(endpoint, {
        token,
        method: 'POST',
        body: { permission_id: permId },
      });

      setOperatorPermissions((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((p) =>
          Number(p.permission_id) === permId ? { ...p, assigned: currentlyAssigned ? 0 : 1 } : p,
        );
      });
    } catch (e) {
      setOperatorPermsError(e?.message || 'Failed to update permission');
    } finally {
      setPermBusyId(null);
    }
  }

  if (!canAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Permissions</h1>
          <p className="text-sm font-semibold text-text-muted">Grant and revoke operator feature access</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Operator Permissions</h3>
            <p className="text-xs text-text-muted mt-1">
              Select an operator, then grant/revoke feature permissions (for example: <span className="text-white font-semibold">ais.view</span>).
            </p>
          </div>

          {adminUsersError ? (
            <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 mb-4">
              {adminUsersError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm font-extrabold text-white mb-3">Operators</div>

              {adminUsersLoading && !adminUsers ? (
                <div className="text-xs text-text-muted">Loading operators…</div>
              ) : null}

              <div className="space-y-2 max-h-96 overflow-auto">
                {operators.map((u) => {
                  const active = String(u.user_id) === String(selectedOperatorId);
                  return (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => setSelectedOperatorId(String(u.user_id))}
                      className={`w-full text-left rounded-lg border px-2.5 py-1.5 transition-colors text-[10px] ${
                        active
                          ? 'border-accent-orange/30 bg-accent-orange/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-semibold text-white truncate">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-[9px] text-text-muted truncate">{u.email}</div>
                    </button>
                  );
                })}
                {!adminUsersLoading && operators.length === 0 ? (
                      <div className="text-xs text-text-muted">No operators found.</div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-extrabold text-white">Permissions</div>
                  <div className="text-[10px] text-text-muted">
                    {selectedOperator
                      ? `${selectedOperator.first_name} ${selectedOperator.last_name}`
                      : 'Select an operator'}
                  </div>
                </div>
              </div>

              {operatorPermsError ? (
                <div className="mb-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {operatorPermsError}
                </div>
              ) : null}

              {selectedOperator && operatorPermsLoading && !operatorPermissions ? (
                <div className="text-xs text-text-muted">Loading permissions…</div>
              ) : null}

              {selectedOperator && Array.isArray(operatorPermissions) ? (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {operatorPermsByModule.map(({ module, perms }) => (
                    <div key={module} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                        {module}
                      </div>

                      <div className="space-y-1">
                        {perms.map((p) => {
                          const assigned = Number(p.assigned) === 1;
                          const busy = Number(permBusyId) === Number(p.permission_id);
                          return (
                            <div
                              key={p.permission_id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                                {p.description ? (
                                  <div className="text-[10px] text-text-muted truncate">{p.description}</div>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                disabled={busy || operatorPermsLoading}
                                onClick={() => togglePermission(p)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors disabled:opacity-50 whitespace-nowrap ${
                                  assigned
                                    ? 'text-red-200 border-red-400/20 bg-red-500/10 hover:bg-red-500/20'
                                    : 'text-green-200 border-green-400/20 bg-green-500/10 hover:bg-green-500/20'
                                }`}
                              >
                                {busy ? '…' : assigned ? 'Revoke' : 'Grant'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
