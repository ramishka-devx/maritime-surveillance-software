import React, { useState } from 'react';

export default function UsersTable({
  users = [],
  isLoading = false,
  onEditUser,
  onResetPassword,
  onToggleDeactivate,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalRecords = 0,
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);

  const toggleRowMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'super_admin' || r === 'super administrator' || r === 'super admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 font-mono text-xs uppercase font-semibold border border-purple-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Super Admin
        </span>
      );
    }
    if (r === 'administrator' || r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 font-mono text-xs uppercase font-semibold border border-blue-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Administrator
        </span>
      );
    }
    if (r === 'analyst') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono text-xs uppercase font-semibold border border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Analyst
        </span>
      );
    }
    if (r === 'viewer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 font-mono text-xs uppercase font-semibold border border-slate-600/30">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Viewer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-mono text-xs uppercase font-semibold border border-cyan-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        Operator
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-500/30 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-semibold border border-amber-500/30 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/60 text-red-300 font-semibold border border-red-500/30 text-[10px]">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        DEACTIVATED
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="px-4 pt-3 pb-6 flex flex-col gap-2 font-sans select-none">
      <div className="w-full overflow-x-auto rounded bg-surface-container-lowest border border-outline-variant/30">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-surface-container-high text-outline text-[11px] uppercase tracking-wider border-b border-outline-variant/30">
              <th className="py-2.5 px-4 font-semibold">User / Ident</th>
              <th className="py-2.5 px-4 font-semibold">Clearance Role</th>
              <th className="py-2.5 px-4 font-semibold">Account Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Last Telemetry Login</th>
              <th className="py-2.5 px-4 font-semibold text-right">Provisioned</th>
              <th className="py-2.5 px-4 font-semibold text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-on-surface">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-cyan-400 font-mono text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl animate-spin text-cyan-400">
                      sync
                    </span>
                    <span>Retrieving operational personnel registry...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-outline font-mono text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-outline/50">
                      person_off
                    </span>
                    <span>No user records found matching the active filter.</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const s = String(u.status || '').toUpperCase();
                const isActive = s === 'ACTIVE' || s === 'VERIFIED';
                const userId = u.id || `usr-${u.user_id}`;
                const userName =
                  u.name ||
                  [u.first_name, u.last_name].filter(Boolean).join(' ') ||
                  u.username ||
                  `User #${u.user_id || u.id}`;
                const userEmail = u.email || 'N/A';
                const userRole = u.role || 'Operator';
                const lastLoginText =
                  u.lastLogin ||
                  (u.updated_at ? `${new Date(u.updated_at).toUTCString().slice(17, 22)} UTC` : 'Active Session');
                const provisionedText =
                  u.provisioned ||
                  (u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '—');

                return (
                  <tr
                    key={userId}
                    className={`${
                      isActive ? 'bg-surface-container-low' : 'bg-surface-container/60 opacity-75'
                    } hover:bg-surface-container transition-colors group`}
                  >
                    {/* User Ident */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 ${
                            isActive
                              ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30'
                              : 'bg-surface-container-highest text-outline'
                          }`}
                        >
                          {u.profileImg || u.profile_img ? (
                            <img
                              src={u.profileImg || u.profile_img}
                              alt={userName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            getInitials(userName)
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-on-surface font-sans text-xs group-hover:text-cyan-400 transition-colors truncate">
                              {userName}
                            </span>
                            {u.username && (
                              <span className="text-[10px] text-cyan-400/80 font-mono">
                                @{u.username}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-outline truncate">{userEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getRoleBadge(userRole)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getStatusBadge(u.status)}
                    </td>

                    {/* Last Login */}
                    <td className="py-2.5 px-4 text-right text-on-surface whitespace-nowrap text-[11px]">
                      {lastLoginText}
                    </td>

                    {/* Provisioned */}
                    <td className="py-2.5 px-4 text-right text-outline whitespace-nowrap text-[11px]">
                      {provisionedText}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-center relative">
                      <button
                        type="button"
                        onClick={(e) => toggleRowMenu(userId, e)}
                        className="p-1 rounded hover:bg-surface-container-highest text-outline hover:text-on-surface transition-colors cursor-pointer"
                        title="User Actions"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>

                      {/* Action Dropdown Menu */}
                      {activeMenuId === userId && (
                        <>
                          <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-4 top-10 z-30 w-48 rounded bg-surface-container-high border border-outline-variant/40 shadow-xl py-1 text-left font-mono text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onEditUser) onEditUser(u);
                              }}
                              className="w-full px-3 py-1.5 text-left text-on-surface hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-cyan-400">
                                edit
                              </span>
                              <span>Edit Credentials</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onResetPassword) onResetPassword(u);
                              }}
                              className="w-full px-3 py-1.5 text-left text-on-surface hover:bg-surface-container-highest flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-blue-300">
                                vpn_key
                              </span>
                              <span>Reset Password</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onToggleDeactivate) onToggleDeactivate(u);
                              }}
                              className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer transition-colors ${
                                isActive
                                  ? 'text-red-400 hover:bg-red-950/40'
                                  : 'text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isActive ? 'block' : 'check_circle'}
                              </span>
                              <span>{isActive ? 'Deactivate User' : 'Re-activate User'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between py-2 px-3 bg-surface-container-low rounded border border-outline-variant/20 gap-2 font-mono text-xs">
        <span className="text-outline text-[11px]">
          Showing {users.length > 0 ? 1 : 0}–{users.length} of {totalRecords || users.length} records
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange && onPageChange(1)}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-surface-container text-outline hover:text-on-surface disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">first_page</span>
          </button>
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-surface-container text-outline hover:text-on-surface disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {[...Array(Math.max(1, totalPages || 1))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  currentPage === pageNum
                    ? 'bg-cyan-400 text-black'
                    : 'bg-surface-container text-outline hover:text-on-surface'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= (totalPages || 1)}
            className="p-1 rounded bg-surface-container text-outline hover:text-on-surface disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
          <button
            onClick={() => onPageChange && onPageChange(totalPages || 1)}
            disabled={currentPage >= (totalPages || 1)}
            className="p-1 rounded bg-surface-container text-outline hover:text-on-surface disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">last_page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
