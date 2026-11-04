import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';
import { roleLabel } from '../../auth/roles.js';
import { focusRing, linkBtn, linkDanger, tag, tagAccent, tagAlert, tagNeutral, td, th } from '../ui/bs.js';

const STATUS_TAG = {
  ACTIVE: ['Active', tagAccent],
  PENDING: ['Pending', tagNeutral],
  DEACTIVATED: ['Deactivated', tagAlert],
};

const initials = (name) => {
  const parts = String(name || '').split(' ').filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : String(name || '?').slice(0, 2)).toUpperCase();
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function UsersTable({
  users = [],
  isLoading = false,
  onToggleDeactivate,
  busyUserId = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  return (
    <section className="mt-5">
      <table className="w-full text-[14px] border-collapse">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.08em] uppercase text-bs-ink/60">
            <th className={th}>User</th>
            <th className={th}>Role</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Updated</th>
            <th className={`${th} text-right`}>Created</th>
            <th className={th}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            users.length === 0 &&
            [0, 1, 2].map((i) => (
              <tr key={i} className="border-b border-bs-ink/[.08]">
                <td className={td}>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52 mt-1.5" />
                </td>
                <td className={td}><Skeleton className="h-5 w-20" /></td>
                <td className={td}><Skeleton className="h-5 w-16" /></td>
                <td className={td}><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className={td}><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className={td} />
              </tr>
            ))}
          {!isLoading && users.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 italic text-bs-neutral-700">No users match these filters.</td>
            </tr>
          )}
          {users.map((u) => {
            const [statusText, statusTag] = STATUS_TAG[u.status] || STATUS_TAG.ACTIVE;
            const active = u.status === 'ACTIVE';
            const img = u.profileImg || u.profile_img;
            return (
              <tr key={u.id} className={`border-b border-bs-ink/[.08] hover:bg-bs-ink/[.04] ${active ? '' : 'text-bs-neutral-700'}`}>
                <td className={td}>
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Initials sit under the photo, so they show if it fails to load. */}
                    <span className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden grid place-items-center bg-bs-surface text-[12px] font-semibold text-bs-neutral-800">
                      {initials(u.name)}
                      {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">
                        {u.name}
                        {u.username && <span className="ml-1.5 font-normal font-mono text-[12px] text-bs-neutral-700">@{u.username}</span>}
                      </span>
                      <span className="block text-[12px] text-bs-neutral-700 truncate">{u.email}</span>
                    </span>
                  </div>
                </td>
                <td className={td}>
                  <span className={`${tag} ${u.role === 'super_admin' ? tagAccent : tagNeutral}`}>{roleLabel(u.role)}</span>
                </td>
                <td className={td}>
                  <span className={`${tag} ${statusTag}`}>{statusText}</span>
                </td>
                <td className={`${td} text-right font-mono text-[13px] whitespace-nowrap`}>{fmtDate(u.updated_at)}</td>
                <td className={`${td} text-right font-mono text-[13px] whitespace-nowrap`}>{fmtDate(u.created_at)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  {u.status !== 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => onToggleDeactivate?.(u)}
                      disabled={busyUserId === u.id}
                      className={active ? linkDanger : linkBtn}
                    >
                      {busyUserId === u.id ? 'Saving…' : active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-[13px]">
          <span className="italic text-bs-neutral-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className={`w-8 h-8 grid place-items-center rounded-sm border border-bs-ink/[.16] hover:enabled:bg-bs-ink/[.07] disabled:opacity-45 ${focusRing}`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className={`w-8 h-8 grid place-items-center rounded-sm border border-bs-ink/[.16] hover:enabled:bg-bs-ink/[.07] disabled:opacity-45 ${focusRing}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
