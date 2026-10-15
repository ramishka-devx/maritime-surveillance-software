import React from 'react';

export default function RolesRosterList({
  roles = [],
  selectedRoleId,
  onSelectRole,
  onNewRole,
  assignedUsers = [],
  assignedUsersCount = null,
  isLoadingUsers = false,
}) {
  const activeRole =
    roles.find((r) => String(r.id) === String(selectedRoleId)) || roles[0] || {};
  const activeIsSystem = activeRole.is_system === 1 || activeRole.is_system === true;
  const displayedUserCount =
    assignedUsersCount !== null && assignedUsersCount !== undefined
      ? assignedUsersCount
      : (activeRole.usersCount ?? 0);

  return (
    <aside className="flex flex-col gap-4 w-full font-sans select-none">
      {/* Roles List Card */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">badge</span>
            <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
              Defined Roles
            </h2>
            <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-cyan-400 font-mono text-xs font-semibold border border-outline-variant/40">
              {roles.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onNewRole}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container border border-dashed border-cyan-400/50 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 transition-colors font-mono text-[11px] uppercase font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>New Role</span>
          </button>
        </div>

        {/* Roles Interactive Stack */}
        <div className="flex flex-col gap-2">
          {roles.length === 0 ? (
            <div className="p-4 text-center text-outline font-mono text-xs">
              Loading defined roles from registry...
            </div>
          ) : (
            roles.map((r) => {
              const isSelected = String(r.id) === String(selectedRoleId);
              const isSystem = r.is_system === 1 || r.is_system === true;
              const count =
                isSelected && assignedUsersCount !== null && assignedUsersCount !== undefined
                  ? assignedUsersCount
                  : (r.usersCount ?? 0);

              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRole(r.id)}
                  className={`p-3 rounded transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'relative bg-surface-container-high border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.22),inset_0_0_2px_#22d3ee]'
                      : 'bg-surface-container/60 border border-outline-variant/30 hover:border-outline-variant opacity-90 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-cyan-400 text-black font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                      ACTIVE INSPECTION
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      
                      <span
                        className={`font-bold text-sm tracking-wide font-mono ${
                          isSelected ? 'text-cyan-400' : 'text-on-surface'
                        }`}
                      >
                        {r.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSystem ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30 font-mono font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">security</span>
                          SYSTEM ROLE
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-cyan-300 border border-cyan-500/20 font-mono font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">tune</span>
                          CUSTOM ROLE
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                          isSelected
                            ? 'bg-cyan-400/10 border border-cyan-400/40 text-cyan-400'
                            : 'bg-surface-container-highest text-outline'
                        }`}
                      >
                        {count} {count === 1 ? 'USER' : 'USERS'}
                      </span>
                    </div>
                  </div>

                  <p className="font-mono text-xs text-on-surface-variant leading-relaxed m-0">
                    {r.description || 'No description provided.'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Role Attribution Metadata Box */}
      <div className="p-4 bg-surface-container-lowest border border-outline-variant/40 rounded flex flex-col gap-2 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-1.5">
          <span className="text-outline uppercase tracking-wider flex items-center gap-1.5 font-bold text-[11px]">
            <span className="material-symbols-outlined text-[15px] text-cyan-400">fingerprint</span>
            Role Diagnostics
          </span>
          <span className="text-emerald-400 text-[11px] font-semibold">
            {activeIsSystem ? 'SYSTEM DEFINED' : 'TENANT CUSTOM'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-1 text-[11px]">
          <div className="flex flex-col">
            <span className="text-outline uppercase text-[10px]">Database ID</span>
            <span className="text-cyan-400 font-bold">role_id #{activeRole.role_id || activeRole.id || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-outline uppercase text-[10px]">Active Personnel</span>
            <span className="text-on-surface font-semibold">
              {displayedUserCount} {displayedUserCount === 1 ? 'user' : 'users'} assigned
            </span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-outline uppercase text-[10px]">Access Policy</span>
            <span className="text-on-surface">
              {activeIsSystem
                ? 'Core system role (protected default)'
                : 'Custom role with configurable privileges'}
            </span>
          </div>

          {/* Assigned Personnel Real Data List */}
          {isLoadingUsers ? (
            <div className="col-span-2 pt-1 text-outline font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Fetching assigned personnel...
            </div>
          ) : assignedUsers.length > 0 ? (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/20 col-span-2">
              <span className="text-outline uppercase text-[10px]">
                Assigned Accounts ({displayedUserCount})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-0.5 max-h-24 overflow-y-auto">
                {assignedUsers.map((u) => (
                  <span
                    key={u.user_id}
                    className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-mono text-cyan-300 border border-outline-variant/30 flex items-center gap-1"
                    title={u.email || u.username}
                  >
                    <span className="material-symbols-outlined text-[12px] text-cyan-400">person</span>
                    {u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User #${u.user_id}`}
                  </span>
                ))}
                {displayedUserCount > assignedUsers.length && (
                  <span className="text-[10px] text-outline font-mono self-center px-1">
                    +{displayedUserCount - assignedUsers.length} more
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Real Role Status Card */}
      <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded flex items-center justify-between font-mono text-xs">
        <div className="flex flex-col">
          <span className="text-outline uppercase text-[10px]">Registry Status</span>
          <span className="text-sm text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {activeRole.is_active === 0 ? 'INACTIVE' : 'ACTIVE IN REGISTRY'}
          </span>
        </div>
        <div className="text-right text-[11px] text-outline">
          {activeRole.permission_count !== undefined && (
            <span>{activeRole.permission_count} permissions</span>
          )}
        </div>
      </div>
    </aside>
  );
}
