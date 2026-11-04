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
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 font-mono text-xs uppercase font-semibold border border-purple-200">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          Super Admin
        </span>
      );
    }
    if (r === 'administrator' || r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 font-mono text-xs uppercase font-semibold border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Administrator
        </span>
      );
    }
    if (r === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-mono text-xs uppercase font-semibold border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Maintenance
        </span>
      );
    }
    if (r === 'viewer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-mono text-xs uppercase font-semibold border border-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Viewer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-cyan-50 text-[#0891b2] font-mono text-xs uppercase font-semibold border border-cyan-200">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0891b2]" />
        Operator
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[10px]">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
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
      <div className="w-full overflow-x-auto rounded-sm bg-white border border-slate-200 shadow-xs">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-4 font-semibold">User / Ident</th>
              <th className="py-2.5 px-4 font-semibold">Clearance Role</th>
              <th className="py-2.5 px-4 font-semibold">Account Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Last Telemetry Login</th>
              <th className="py-2.5 px-4 font-semibold text-right">Provisioned</th>
              <th className="py-2.5 px-4 font-semibold text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-900">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#0891b2] font-mono text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl animate-spin text-[#0891b2]">
                      sync
                    </span>
                    <span>Retrieving operational personnel registry...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-slate-300">
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
                      isActive ? 'bg-white' : 'bg-slate-50/60 opacity-80'
                    } hover:bg-slate-50 transition-colors group`}
                  >
                    {/* User Ident */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 ${
                            isActive
                              ? 'bg-cyan-50 text-[#0891b2] border border-cyan-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
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
                            <span className="font-bold text-slate-900 font-sans text-xs group-hover:text-[#0891b2] transition-colors truncate">
                              {userName}
                            </span>
                            {u.username && (
                              <span className="text-[10px] text-[#0891b2] font-mono">
                                @{u.username}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 truncate">{userEmail}</span>
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
                    <td className="py-2.5 px-4 text-right text-slate-700 whitespace-nowrap text-[11px]">
                      {lastLoginText}
                    </td>

                    {/* Provisioned */}
                    <td className="py-2.5 px-4 text-right text-slate-500 whitespace-nowrap text-[11px]">
                      {provisionedText}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-center relative">
                      <button
                        type="button"
                        onClick={(e) => toggleRowMenu(userId, e)}
                        className="p-1 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
                          <div className="absolute right-4 top-10 z-30 w-48 rounded-sm bg-white border border-slate-200 shadow-xl py-1 text-left font-mono text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onEditUser) onEditUser(u);
                              }}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-[#0891b2]">
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
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-blue-600">
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
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
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
      <div className="flex flex-col sm:flex-row items-center justify-between py-2 px-3 bg-slate-50 rounded-sm border border-slate-200 gap-2 font-mono text-xs">
        <span className="text-slate-500 text-[11px]">
          Showing {users.length > 0 ? 1 : 0}–{users.length} of {totalRecords || users.length} records
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange && onPageChange(1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">first_page</span>
          </button>
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {[...Array(Math.max(1, totalPages || 1))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`px-2 py-0.5 rounded-sm font-bold cursor-pointer transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#0891b2] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= (totalPages || 1)}
            className="p-1 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
          <button
            onClick={() => onPageChange && onPageChange(totalPages || 1)}
            disabled={currentPage >= (totalPages || 1)}
            className="p-1 rounded-sm bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">last_page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
