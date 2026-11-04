import React from 'react';
import { Plus } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';
import { roleLabel } from '../../auth/roles.js';
import { focusRing, kicker, linkBtn } from '../ui/bs.js';

// Role list: name and member count (same pattern as the Restricted areas list).
export default function RolesRosterList({ roles = [], isLoading = false, selectedRoleId, onSelectRole, onNewRole }) {
  return (
    <aside className="flex flex-col min-w-0">
      <div className="flex items-baseline">
        <div className={kicker}>Roles</div>
        <button type="button" onClick={onNewRole} className={`${linkBtn} ml-auto`}>
          <Plus size={14} />
          New role
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-0.5" role="listbox" aria-label="Roles">
        {isLoading && roles.length === 0 && [0, 1].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
        {roles.map((r) => {
          const on = String(r.id) === String(selectedRoleId);
          const n = Number(r.usersCount) || 0;
          return (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onSelectRole(r.id)}
              className={`flex items-center gap-3 pr-4 h-11 text-left ${focusRing} ${on ? 'bg-bs-surface' : 'hover:bg-bs-neutral-200'}`}
            >
              <span className={`w-1 self-stretch ${on ? 'bg-bs-accent' : ''}`} />
              <span className="flex-1 min-w-0 font-semibold text-[15px] truncate">{roleLabel(r.name)}</span>
              <span className="text-[13px] tabular-nums text-bs-neutral-700" title={`${n} user${n === 1 ? '' : 's'}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
