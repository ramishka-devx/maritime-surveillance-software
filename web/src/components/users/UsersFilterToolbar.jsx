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
    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none font-sans">
      {/* Search Input */}
      <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-xl">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search user by name, callsign, or official email..."
            className="w-full bg-slate-50 rounded-sm pl-3.5 pr-10 py-1.5 text-slate-900 font-mono text-xs placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0891b2] transition-colors"
          />
          <button
            type="button"
            onClick={() => onSearchChange(searchQuery)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0891b2] p-1 rounded-sm transition-colors flex items-center justify-center cursor-pointer"
            title="Search"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
        {/* Role Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-sm border border-slate-200">
          <span className="text-[11px] text-slate-500 uppercase">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="bg-transparent text-slate-900 text-xs focus:outline-none cursor-pointer"
          >
            <option className="bg-white text-slate-900" value="all">
              All Roles
            </option>
            <option className="bg-white text-slate-900" value="super_admin">
              Super Admin
            </option>
            <option className="bg-white text-slate-900" value="operator">
              Operator
            </option>
            <option className="bg-white text-slate-900" value="analyst">
              Maintenace
            </option>
          </select>
        </div>

        {/* Status Toggle Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200">
          {['all', 'active', 'pending', 'deactivated'].map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-2.5 py-1 rounded-sm text-xs uppercase transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-[#0891b2] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-900 transition-colors font-mono text-[11px] uppercase cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
          <span>Clear</span>
        </button>

        {/* Counter */}
        <span className="text-slate-500 pl-1">
          Showing {showingCount} of {totalCount} users
        </span>
      </div>
    </div>
  );
}
