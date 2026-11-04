import React, { useMemo } from 'react';
import { Lock } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';
import { roleLabel } from '../../auth/roles.js';
import { groupPermissions, permissionLabel } from '../../lib/permissions.js';
import { focusRing, h2, kicker } from '../ui/bs.js';

export default function RolesPermissionsMatrix({ role = null, permissionsList = [], activePermissionIds = new Set(), isLoadingPermissions = false, onTogglePermissionId }) {
  const locked = !!role?.isLocked;

  const groups = useMemo(() => groupPermissions(permissionsList), [permissionsList]);

  return (
    <section className="min-w-0 max-w-[680px]">
      <h2 className={h2}>{role ? roleLabel(role.name) : 'Permissions'}</h2>
      {locked && (
        <p className="mt-1 flex items-center gap-2 text-[13px] italic text-bs-neutral-700">
          <Lock size={13} />
          Has every permission; can&rsquo;t be changed.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-7">
        {isLoadingPermissions && [0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
        {!isLoadingPermissions && groups.length === 0 && <p className="text-[14px] italic text-bs-neutral-700">No permissions.</p>}
        {!isLoadingPermissions &&
          groups.map(({ key, title, perms }) => (
            <div key={key}>
              <div className={`${kicker} pb-2 border-b border-bs-ink/[.16]`}>{title}</div>
              {perms.map((p) => {
                const on = locked || activePermissionIds.has(p.permission_id);
                return (
                  <button
                    key={p.permission_id}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    disabled={locked}
                    onClick={() => onTogglePermissionId?.(p.permission_id)}
                    title={p.name}
                    className={`w-full flex items-center gap-4 py-3 text-left text-[14px] border-b border-bs-ink/[.08] ${focusRing} ${
                      locked ? 'cursor-default' : 'hover:bg-bs-ink/[.04]'
                    }`}
                  >
                    <span className={`flex-1 min-w-0 ${on ? '' : 'text-bs-neutral-700'}`}>{permissionLabel(p)}</span>
                    <span
                      aria-hidden="true"
                      className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${on ? 'bg-bs-accent' : 'bg-bs-neutral-300'} ${locked ? 'opacity-60' : ''}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-bs-bg shadow-bs-sm transition-transform ${on ? 'translate-x-4' : ''}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
      </div>
    </section>
  );
}
