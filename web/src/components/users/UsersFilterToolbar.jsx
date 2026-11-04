import React from 'react';
import { Search } from 'lucide-react';
import { field, focusRing, linkBtn } from '../ui/bs.js';
import { roleLabel } from '../../auth/roles.js';

const STATUSES = ['all', 'active', 'pending', 'deactivated'];

export default function UsersFilterToolbar({
  searchQuery,
  onSearchChange,
  roles = [],
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  showingCount,
  totalCount,
}) {
  const filtered = searchQuery || roleFilter !== 'all' || statusFilter !== 'all';
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <div className="relative w-[320px] max-w-full">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bs-neutral-700 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, username or email"
          aria-label="Search users"
          className={`${field} pl-8`}
        />
      </div>

      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        aria-label="Filter by role"
        className={`${field} w-auto pr-8 cursor-pointer`}
      >
        <option value="all">All roles</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {roleLabel(r)}
          </option>
        ))}
      </select>

      <div role="radiogroup" aria-label="Status" className="inline-flex border border-bs-ink/[.16] rounded-sm overflow-hidden text-[12px]">
        {STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            role="radio"
            aria-checked={statusFilter === st}
            onClick={() => onStatusFilterChange(st)}
            className={`px-3 py-2 capitalize border-l border-bs-ink/[.16] first:border-l-0 ${focusRing} focus-visible:-outline-offset-2 ${
              statusFilter === st ? 'bg-bs-accent text-bs-bg' : 'hover:bg-bs-ink/[.07]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {filtered && (
        <button type="button" onClick={onClearFilters} className={linkBtn}>
          Clear filters
        </button>
      )}

      <span className="ml-auto text-[13px] italic text-bs-neutral-700">
        Showing {showingCount} of {totalCount}
      </span>
    </div>
  );
}
