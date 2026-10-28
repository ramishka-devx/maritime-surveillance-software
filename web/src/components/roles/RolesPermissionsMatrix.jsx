import React, { useMemo } from 'react';

const MODULE_CONFIG = {
  dashboard: {
    icon: 'dashboard',
    badge: 'CORE TELEMETRY',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/20',
  },
  alert: {
    icon: 'notification_important',
    badge: 'INCIDENT DISPATCH',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
  },
  alerts: {
    icon: 'notification_important',
    badge: 'INCIDENT DISPATCH',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
  },
  reports: {
    icon: 'summarize',
    badge: 'ANALYTICS & EXPORT',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
  },
  report: {
    icon: 'summarize',
    badge: 'ANALYTICS & EXPORT',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
  },
  users: {
    icon: 'manage_accounts',
    badge: 'IDENTITY ACCESS',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-950/20',
  },
  user: {
    icon: 'person',
    badge: 'IDENTITY ACCESS',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-950/20',
  },
  roles: {
    icon: 'verified_user',
    badge: 'AUTHORIZATION RBAC',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
  },
  role: {
    icon: 'verified_user',
    badge: 'AUTHORIZATION RBAC',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
  },
};

function getModuleConfig(modName) {
  const key = String(modName || '').toLowerCase();
  return (
    MODULE_CONFIG[key] || {
      icon: 'folder_open',
      badge: `${key.toUpperCase()} MODULE`,
      color: 'text-teal-400',
      border: 'border-teal-500/30',
      bg: 'bg-teal-950/20',
    }
  );
}

export default function RolesPermissionsMatrix({
  role = {},
  permissionsList = [],
  activePermissionIds = new Set(),
  isLoadingPermissions = false,
  onTogglePermissionId,
  onSelectAllView,
  onClearDeletes,
  onResetBaseline,
}) {
  const isSuperAdmin =
    (role?.is_system === 1 || role?.is_system === true) && role?.name === 'super_admin';

  // Defensive check for whether a permission is currently granted
  const isPermActive = (permId) => {
    if (isSuperAdmin) return true;
    if (!activePermissionIds) return false;
    if (activePermissionIds instanceof Set) return activePermissionIds.has(permId);
    if (Array.isArray(activePermissionIds)) return activePermissionIds.includes(permId);
    return false;
  };

  // Group permissions dynamically by permission.module
  const groupedModules = useMemo(() => {
    const map = {};
    for (const perm of permissionsList) {
      const mod = (perm.module || 'general').toLowerCase();
      if (!map[mod]) {
        map[mod] = [];
      }
      map[mod].push(perm);
    }

    const preferredOrder = [
      'dashboard',
      'alert',
      'alerts',
      'reports',
      'report',
      'users',
      'user',
      'roles',
      'role',
    ];

    return Object.entries(map)
      .sort(([a], [b]) => {
        const idxA = preferredOrder.indexOf(a);
        const idxB = preferredOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(([moduleName, perms]) => ({
        name: moduleName,
        permissions: [...perms].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [permissionsList]);

  // Total active count calculation
  const totalActiveCount = useMemo(() => {
    if (isSuperAdmin) return permissionsList.length;
    return permissionsList.filter((p) => isPermActive(p.permission_id)).length;
  }, [permissionsList, activePermissionIds, isSuperAdmin]);

  // Toggle all permissions within a specific module
  const handleToggleModule = (perms) => {
    if (isSuperAdmin || !onTogglePermissionId) return;
    const allActive = perms.every((p) => isPermActive(p.permission_id));
    for (const p of perms) {
      if (allActive) {
        if (isPermActive(p.permission_id)) {
          onTogglePermissionId(p.permission_id);
        }
      } else {
        if (!isPermActive(p.permission_id)) {
          onTogglePermissionId(p.permission_id);
        }
      }
    }
  };

  return (
    <section className="flex flex-col gap-4 w-full font-sans select-none">
      <div className="bg-white border border-slate-200 rounded-lg flex flex-col shadow-xs overflow-hidden">
        {/* Matrix Panel Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight m-0 font-mono">
                Permissions Matrix — {role?.name || 'Selected'}
              </h2>
              {isSuperAdmin ? (
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  ROOT BYPASS
                </span>
              ) : role?.is_system === 1 ? (
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold uppercase tracking-wider">
                  SYSTEM ROLE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-cyan-50 text-[#0891b2] border border-cyan-200 font-mono text-[10px] font-bold uppercase tracking-wider">
                  CUSTOM ROLE
                </span>
              )}
            </div>
          </div>

          {/* Quick Selection Action Toggles */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <button
              type="button"
              disabled={isSuperAdmin}
              onClick={onSelectAllView}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                isSuperAdmin
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer shadow-xs'
              }`}
            >
              Select All View
            </button>
            <button
              type="button"
              disabled={isSuperAdmin}
              onClick={onClearDeletes}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                isSuperAdmin
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer shadow-xs'
              }`}
            >
              Clear Deletes
            </button>
            <button
              type="button"
              disabled={isSuperAdmin}
              onClick={onResetBaseline}
              className={`px-2.5 py-1 rounded-lg border uppercase font-semibold transition-colors flex items-center gap-1 ${
                isSuperAdmin
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-[#0891b2] cursor-pointer shadow-xs'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* Super Admin Notice Banner */}
        {isSuperAdmin && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-amber-900 font-mono text-xs">
            <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">
              shield_person
            </span>
            <div className="flex flex-col gap-0.5">
              
              <p className="text-[11px] text-amber-800 m-0 leading-relaxed">
                Permissions cannot be altered or revoked for this role.
              </p>
            </div>
          </div>
        )}

        {/* Matrix Status Legend Bar */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0891b2] text-white flex items-center justify-center font-bold text-[9px]">
                ✓
              </span>
              <span className="text-slate-900 font-medium text-[11px]">
                Granted ({totalActiveCount} / {permissionsList.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 inline-block" />
              <span className="text-slate-500 text-[11px]">Revoked / Denied</span>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-[9px]">
                  <span className="material-symbols-outlined text-[10px]">lock</span>
                </span>
                <span className="text-amber-700 text-[11px] font-semibold">Root Bypass (Locked)</span>
              </div>
            )}
          </div>
          <div className="text-slate-500 flex items-center gap-1 text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-[#0891b2]">
              rule_settings
            </span>
            <span>Live RBAC Synchronization</span>
          </div>
        </div>

        {/* Dynamic Grouped Permissions List */}
        <div className="p-4 flex flex-col gap-4">
          {isLoadingPermissions ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[#0891b2] text-2xl animate-spin">
                progress_activity
              </span>
              <span>Loading permissions registry from backend...</span>
            </div>
          ) : groupedModules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-slate-300 text-2xl">
                rule
              </span>
              <span>No permissions registered for this role.</span>
            </div>
          ) : (
            groupedModules.map((group) => {
              const activeInGroup = group.permissions.filter((p) =>
                isPermActive(p.permission_id)
              ).length;
              const isAllGroupActive = activeInGroup === group.permissions.length;

              return (
                <div
                  key={group.name}
                  className="bg-slate-50/40 border border-slate-200 rounded-lg overflow-hidden shadow-xs"
                >
                  {/* Module Group Header */}
                  <div className="p-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-xs font-bold uppercase text-slate-900 m-0 tracking-wider">
                          {group.name} Module
                        </h3>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-white text-[#0891b2] border border-slate-200 shadow-xs">
                          {activeInGroup} / {group.permissions.length} GRANTED
                        </span>
                      </div>
                    </div>

                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleModule(group.permissions)}
                        className="px-2 py-1 rounded text-[11px] font-mono uppercase bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 shadow-xs flex items-center gap-1"
                        title={
                          isAllGroupActive
                            ? `Revoke all ${group.name} permissions`
                            : `Grant all ${group.name} permissions`
                        }
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isAllGroupActive ? 'remove_done' : 'done_all'}
                        </span>
                        <span>{isAllGroupActive ? 'Revoke All' : 'Grant All'}</span>
                      </button>
                    )}
                  </div>

                  {/* Permissions Rows in this Module */}
                  <div className="divide-y divide-slate-100">
                    {group.permissions.map((perm) => {
                      const active = isPermActive(perm.permission_id);

                      return (
                        <div
                          key={perm.permission_id}
                          className="p-3 px-4 flex items-center justify-between gap-4 hover:bg-white transition-colors"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-mono text-xs font-bold tracking-wide ${
                                  active ? 'text-[#0891b2]' : 'text-slate-800'
                                }`}
                              >
                                {perm.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                                id #{perm.permission_id}
                              </span>
                            </div>
                            <span className="font-sans text-xs text-slate-500 truncate">
                              {perm.description || 'Permission action authorized by service kernel.'}
                            </span>
                          </div>

                          {/* Toggle Switch */}
                          <div className="flex items-center shrink-0">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={active}
                              disabled={isSuperAdmin}
                              onClick={() =>
                                !isSuperAdmin &&
                                onTogglePermissionId &&
                                onTogglePermissionId(perm.permission_id)
                              }
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                isSuperAdmin
                                  ? 'opacity-80 cursor-not-allowed bg-amber-100 border border-amber-300'
                                  : active
                                  ? 'bg-[#0891b2] shadow-xs cursor-pointer'
                                  : 'bg-slate-200 hover:bg-slate-300 border border-slate-300 cursor-pointer'
                              }`}
                              title={
                                isSuperAdmin
                                  ? 'Super Admin automatically possesses all permissions (root bypass)'
                                  : active
                                  ? `Click to revoke ${perm.name}`
                                  : `Click to grant ${perm.name}`
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ease-in-out flex items-center justify-center ${
                                  active
                                    ? 'translate-x-6 bg-white text-[#0891b2]'
                                    : 'translate-x-1 bg-white shadow-xs'
                                }`}
                              >
                                {isSuperAdmin ? (
                                  <span className="material-symbols-outlined text-[10px] text-amber-600">
                                    lock
                                  </span>
                                ) : active ? (
                                  <span className="material-symbols-outlined text-[11px] font-bold">
                                    check
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
