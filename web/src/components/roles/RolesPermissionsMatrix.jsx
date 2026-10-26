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
      <div className="bg-surface-container-low border border-outline-variant/30 rounded flex flex-col shadow-md overflow-hidden">
        {/* Matrix Panel Header */}
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-on-surface uppercase tracking-tight m-0 font-mono">
                Permissions Matrix — {role?.name || 'Selected'}
              </h2>
              {isSuperAdmin ? (
                <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  ROOT BYPASS
                </span>
              ) : role?.is_system === 1 ? (
                <span className="px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                  SYSTEM ROLE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-cyan-300 border border-cyan-500/20 font-mono text-[10px] font-bold uppercase tracking-wider">
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
              className={`px-2.5 py-1 rounded bg-surface-container-highest border border-outline-variant/40 text-on-surface uppercase transition-colors ${
                isSuperAdmin
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-surface-bright cursor-pointer hover:text-cyan-400'
              }`}
            >
              Select All View
            </button>
            <button
              type="button"
              disabled={isSuperAdmin}
              onClick={onClearDeletes}
              className={`px-2.5 py-1 rounded bg-surface-container-highest border border-outline-variant/40 text-on-surface uppercase transition-colors ${
                isSuperAdmin
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-surface-bright cursor-pointer hover:text-amber-400'
              }`}
            >
              Clear Deletes
            </button>
            <button
              type="button"
              disabled={isSuperAdmin}
              onClick={onResetBaseline}
              className={`px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/50 text-cyan-400 uppercase font-semibold transition-colors flex items-center gap-1 ${
                isSuperAdmin
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-surface-container cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* Super Admin Notice Banner */}
        {isSuperAdmin && (
          <div className="px-4 py-3 bg-amber-950/30 border-b border-amber-500/30 flex items-start gap-2.5 text-amber-200 font-mono text-xs">
            <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0 mt-0.5">
              shield_person
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold uppercase tracking-wider text-amber-300">
                Super Administrator Root Bypass Enforced
              </span>
              <p className="text-[11px] text-amber-200/80 m-0 leading-relaxed">
                The <code className="text-amber-300 font-bold px-1 py-0.2 bg-amber-950/60 rounded border border-amber-500/30">super_admin</code> role possesses unconditional kernel bypass privileges across all endpoints. Permissions cannot be altered or revoked for this role.
              </p>
            </div>
          </div>
        )}

        {/* Matrix Status Legend Bar */}
        <div className="px-4 py-2 bg-surface-container-lowest border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold text-[9px]">
                ✓
              </span>
              <span className="text-on-surface font-medium text-[11px]">
                Granted ({totalActiveCount} / {permissionsList.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-surface-container-high border border-outline-variant/60 inline-block" />
              <span className="text-on-surface-variant text-[11px]">Revoked / Denied</span>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center text-[9px]">
                  <span className="material-symbols-outlined text-[10px]">lock</span>
                </span>
                <span className="text-amber-400 text-[11px]">Root Bypass (Locked)</span>
              </div>
            )}
          </div>
          <div className="text-outline flex items-center gap-1 text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-cyan-400">
              rule_settings
            </span>
            <span>Live RBAC Synchronization</span>
          </div>
        </div>

        {/* Dynamic Grouped Permissions List */}
        <div className="p-4 flex flex-col gap-4">
          {isLoadingPermissions ? (
            <div className="p-12 text-center text-outline font-mono text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-2xl animate-spin">
                progress_activity
              </span>
              <span>Loading permissions registry from backend...</span>
            </div>
          ) : groupedModules.length === 0 ? (
            <div className="p-12 text-center text-outline font-mono text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-outline text-2xl">
                rule
              </span>
              <span>No permissions registered for this role.</span>
            </div>
          ) : (
            groupedModules.map((group) => {
              const config = getModuleConfig(group.name);
              const activeInGroup = group.permissions.filter((p) =>
                isPermActive(p.permission_id)
              ).length;
              const isAllGroupActive = activeInGroup === group.permissions.length;

              return (
                <div
                  key={group.name}
                  className="bg-surface-container/50 border border-outline-variant/30 rounded overflow-hidden shadow-xs"
                >
                  {/* Module Group Header */}
                  <div className="p-3 py-1.5 bg-surface-container-high/60 border-b border-outline-variant/25 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-xs font-bold uppercase text-on-surface m-0 tracking-wider">
                          {group.name} Module
                        </h3>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-surface-container-highest text-cyan-300 border border-outline-variant/40">
                          {activeInGroup} / {group.permissions.length} GRANTED
                        </span>
                      </div>
                    </div>

                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleModule(group.permissions)}
                        className="px-2 py-1 rounded text-[11px] font-mono uppercase bg-surface-container hover:bg-surface-container-highest text-outline hover:text-cyan-400 transition-colors cursor-pointer border border-outline-variant/30 flex items-center gap-1"
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
                  <div className="divide-y divide-outline-variant/15">
                    {group.permissions.map((perm) => {
                      const active = isPermActive(perm.permission_id);

                      return (
                        <div
                          key={perm.permission_id}
                          className="p-3 px-4 flex items-center justify-between gap-4 hover:bg-surface-container-high/40 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-mono text-xs font-bold tracking-wide ${
                                  active ? 'text-cyan-400' : 'text-on-surface'
                                }`}
                              >
                                {perm.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-surface-container-lowest text-outline border border-outline-variant/20">
                                id #{perm.permission_id}
                              </span>
                            </div>
                            <span className="font-sans text-xs text-on-surface-variant truncate">
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
                                  ? 'opacity-80 cursor-not-allowed bg-amber-500/30 border border-amber-500/40'
                                  : active
                                  ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)] cursor-pointer'
                                  : 'bg-surface-container-highest border border-outline-variant/60 hover:border-outline cursor-pointer'
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
                                    ? 'translate-x-6 bg-black text-cyan-400'
                                    : 'translate-x-1 bg-outline text-transparent'
                                }`}
                              >
                                {isSuperAdmin ? (
                                  <span className="material-symbols-outlined text-[10px] text-amber-400">
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
