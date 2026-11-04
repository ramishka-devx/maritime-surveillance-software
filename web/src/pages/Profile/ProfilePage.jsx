import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { roleLabel } from '../../auth/roles.js';
import { groupPermissions, permissionLabel } from '../../lib/permissions.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { btn, btnNeutral, h2, kicker, pageShell, pageTitle } from '../../components/ui/bs.js';

const STATUS = { verified: 'Active', pending: 'Pending', disabled: 'Deactivated' };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const initials = (name) =>
  String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// Read-only: the API has no self-service edit or password change (only GET /api/users/me).
export default function ProfilePage() {
  const { user, permissions = [], logout } = useAuth();
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || '';
  const role = user?.role || '';
  const superAdmin = role === 'super_admin' || user?.role_id === 1;
  const img = user?.profileImg || user?.profile_img;
  const names = (Array.isArray(permissions) ? permissions : []).map((p) => (typeof p === 'string' ? p : p.name)).filter(Boolean);
  const groups = groupPermissions(names);

  return (
    <div className={pageShell}>
      <div className="flex flex-wrap items-center gap-4 min-h-[42px]">
        <h1 className={pageTitle}>My profile</h1>
        <button type="button" onClick={logout} className={`${btn} ${btnNeutral} ml-auto`}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-x-12 gap-y-8 items-start">
        <aside className="flex flex-col items-start gap-3">
          <span className="relative w-24 h-24 rounded-full overflow-hidden grid place-items-center bg-bs-surface text-[28px] font-semibold text-bs-neutral-800">
            {initials(name)}
            {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          </span>
          {user ? (
            <h2 className={h2}>{name}</h2>
          ) : (
            <Skeleton className="h-6 w-40" />
          )}
        </aside>

        <section className="min-w-0 max-w-[680px] flex flex-col gap-7">
          <div>
            <div className={`${kicker} pb-2 border-b border-bs-ink/[.16]`}>Account</div>
            <dl className="m-0 text-[14px]">
              {[
                ['Email', user?.email],
                ['Username', user?.username && <span className="font-mono text-[13px]">{user.username}</span>],
                ['Role', role && roleLabel(role)],
                ['Status', STATUS[user?.status] || user?.status],
                ['Member since', user && fmtDate(user.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 py-3 border-b border-bs-ink/[.08]">
                  <dt className="w-36 shrink-0 text-bs-neutral-700">{label}</dt>
                  <dd className="m-0 min-w-0 truncate">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[12px] italic text-bs-neutral-700">To change your details or password, ask an administrator.</p>
          </div>

          <div>
            <div className={`${kicker} pb-2 border-b border-bs-ink/[.16]`}>Your access</div>
            {superAdmin && <p className="py-3 m-0 text-[14px] border-b border-bs-ink/[.08]">Every permission.</p>}
            {!superAdmin && groups.length === 0 && (
              <p className="py-3 m-0 text-[14px] italic text-bs-neutral-700 border-b border-bs-ink/[.08]">No permissions.</p>
            )}
            {!superAdmin &&
              groups.map(({ key, title, perms }) => (
                <div key={key} className="flex gap-4 py-3 border-b border-bs-ink/[.08] text-[14px]">
                  <span className="w-36 shrink-0 text-bs-neutral-700">{title}</span>
                  <span className="min-w-0">{perms.map(permissionLabel).join(', ')}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
