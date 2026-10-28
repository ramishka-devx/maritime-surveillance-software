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
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0891b2] text-[18px]">badge</span>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono m-0">
              Defined Roles
            </h2>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[#0891b2] font-mono text-xs font-semibold border border-slate-200">
              {roles.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onNewRole}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-dashed border-[#0891b2] hover:bg-cyan-50 text-[#0891b2] transition-colors font-mono text-[11px] uppercase font-semibold cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>New Role</span>
          </button>
        </div>

        {/* Roles Interactive Stack */}
        <div className="flex flex-col gap-2">
          {roles.length === 0 ? (
            <div className="p-4 text-center text-slate-400 font-mono text-xs">
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
                  className={`p-3 rounded-lg transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'relative bg-cyan-50/50 border-2 border-[#0891b2] shadow-xs'
                      : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-[#0891b2] text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      ACTIVE INSPECTION
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm tracking-wide font-mono ${
                          isSelected ? 'text-[#0891b2]' : 'text-slate-900'
                        }`}
                      >
                        {r.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSystem ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">security</span>
                          SYSTEM ROLE
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">tune</span>
                          CUSTOM ROLE
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                          isSelected
                            ? 'bg-[#0891b2]/10 border border-[#0891b2]/30 text-[#0891b2]'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {count} {count === 1 ? 'USER' : 'USERS'}
                      </span>
                    </div>
                  </div>

                  <p className="font-mono text-xs text-slate-500 leading-relaxed m-0">
                    {r.description || 'No description provided.'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Role Attribution Metadata Box */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2 font-mono text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <span className="text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-bold text-[11px]">
            <span className="material-symbols-outlined text-[15px] text-[#0891b2]">fingerprint</span>
            Role Diagnostics
          </span>
          <span className="text-emerald-700 text-[11px] font-semibold">
            {activeIsSystem ? 'SYSTEM DEFINED' : 'TENANT CUSTOM'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-1 text-[11px]">
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase text-[10px]">Database ID</span>
            <span className="text-[#0891b2] font-bold">role_id #{activeRole.role_id || activeRole.id || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase text-[10px]">Active Personnel</span>
            <span className="text-slate-900 font-semibold">
              {displayedUserCount} {displayedUserCount === 1 ? 'user' : 'users'} assigned
            </span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-slate-500 uppercase text-[10px]">Access Policy</span>
            <span className="text-slate-700">
              {activeIsSystem
                ? 'Core system role (protected default)'
                : 'Custom role with configurable privileges'}
            </span>
          </div>

          {/* Assigned Personnel Real Data List */}
          {isLoadingUsers ? (
            <div className="col-span-2 pt-1 text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
              Fetching assigned personnel...
            </div>
          ) : assignedUsers.length > 0 ? (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 col-span-2">
              <span className="text-slate-500 uppercase text-[10px]">
                Assigned Accounts ({displayedUserCount})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-0.5 max-h-24 overflow-y-auto">
                {assignedUsers.map((u) => (
                  <span
                    key={u.user_id}
                    className="px-2 py-0.5 rounded bg-slate-50 text-[11px] font-mono text-slate-800 border border-slate-200 flex items-center gap-1"
                    title={u.email || u.username}
                  >
                    <span className="material-symbols-outlined text-[12px] text-[#0891b2]">person</span>
                    {u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User #${u.user_id}`}
                  </span>
                ))}
                {displayedUserCount > assignedUsers.length && (
                  <span className="text-[10px] text-slate-400 font-mono self-center px-1">
                    +{displayedUserCount - assignedUsers.length} more
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Real Role Status Card */}
      <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between font-mono text-xs shadow-xs">
        <div className="flex flex-col">
          <span className="text-slate-500 uppercase text-[10px]">Registry Status</span>
          <span className="text-sm text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeRole.is_active === 0 ? 'INACTIVE' : 'ACTIVE IN REGISTRY'}
          </span>
        </div>
        <div className="text-right text-[11px] text-slate-500">
          {activeRole.permission_count !== undefined && (
            <span>{activeRole.permission_count} permissions</span>
          )}
        </div>
      </div>
    </aside>
  );
}
