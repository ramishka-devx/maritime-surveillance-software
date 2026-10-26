import React from 'react';

export default function UsersFilterToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  showingCount,
  totalCount,
}) {
  return (
    <div className="px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 select-none font-sans">
      {/* Search Input */}
      <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-xl">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search user by name, callsign, or official email..."
            className="w-full bg-surface-container-high rounded pl-3.5 pr-10 py-1.5 text-on-surface font-mono text-xs placeholder:text-outline border border-outline-variant/20 focus:outline-none focus:bg-surface-container-highest focus:border-cyan-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => onSearchChange(searchQuery)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-cyan-400 p-1 rounded transition-colors flex items-center justify-center cursor-pointer"
            title="Search"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
        {/* Role Filter */}
        <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded border border-outline-variant/20">
          <span className="text-[11px] text-outline uppercase">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="bg-transparent text-on-surface text-xs focus:outline-none cursor-pointer"
          >
            <option className="bg-surface-container-high text-on-surface" value="all">
              All Roles
            </option>
            <option className="bg-surface-container-high text-on-surface" value="super_admin">
              Super Admin
            </option>
            <option className="bg-surface-container-high text-on-surface" value="operator">
              Watch Operator
            </option>
            <option className="bg-surface-container-high text-on-surface" value="analyst">
              Intelligence Analyst
            </option>
          </select>
        </div>

        {/* Status Toggle Pills */}
        <div className="flex items-center bg-surface-container-high p-0.5 rounded border border-outline-variant/20">
          {['all', 'active', 'pending', 'deactivated'].map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-2.5 py-1 rounded text-xs uppercase transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-surface-container-highest text-cyan-400 font-bold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-2 py-1 text-outline hover:text-on-surface transition-colors font-mono text-[11px] uppercase"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
          <span>Clear</span>
        </button>

        {/* Counter */}
        <span className="text-outline pl-1">
          Showing {showingCount} of {totalCount} users
        </span>
      </div>
    </div>
  );
}
