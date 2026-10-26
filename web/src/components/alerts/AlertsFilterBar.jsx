import React from 'react';

export default function AlertsFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  severityFilter,
  onSeverityFilterChange,
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  totalCount = 24,
  displayedCount = 10,
}) {
  return (
    <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30 flex flex-col justify-between gap-3 text-xs font-sans">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Search Input */}
        <div className="relative flex items-center min-w-[160px] flex-1 max-w-md">
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded pl-3.5 pr-10 py-1.5 text-on-surface font-mono text-xs placeholder:text-outline/70 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            placeholder="Search alerts by vessel, MMSI, or ID..."
            type="text"
          />
          <button
            type="button"
            onClick={() => onSearchChange(searchQuery)}
            className="absolute right-2 text-outline hover:text-cyan-400 p-1 rounded transition-colors flex items-center justify-center cursor-pointer"
            title="Search"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
        </div>

        {/* Filter: Status */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/40 hover:border-outline text-on-surface rounded px-2.5 py-1.5 font-medium focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">Status: All</option>
          <option value="OPEN">Status: Open</option>
          <option value="ACKNOWLEDGED">Status: Acknowledged</option>
          <option value="RESOLVED">Status: Resolved</option>
        </select>

        {/* Filter: Severity */}
        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilterChange(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/40 hover:border-outline text-on-surface rounded px-2.5 py-1.5 font-medium focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">Severity: All</option>
          <option value="CRIT">Critical</option>
          <option value="HIGH">High</option>
          <option value="MED">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Filter: Type */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/40 hover:border-outline text-on-surface rounded px-2.5 py-1.5 font-medium focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">Type: All Types</option>
          <option value="Transponder Spoofing">Transponder Spoofing</option>
          <option value="Restricted Area Incursion">Restricted Area Incursion</option>
          <option value="Dark Vessel / AIS Lost">Dark Vessel / AIS Lost</option>
          <option value="Collision Risk">Collision Risk</option>
          <option value="Speed Anomaly">Speed Anomaly</option>
          <option value="Loitering Pattern">Loitering Pattern</option>
          <option value="Unsanctioned STS Transfer">STS Transfer</option>
        </select>

        {/* Filter: Date Range */}
        <select
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/40 hover:border-outline text-on-surface rounded px-2.5 py-1.5 font-medium focus:outline-none focus:border-cyan-400"
        >
          <option value="24h">Last 24 Hours (UTC)</option>
          <option value="12h">Last 12 Hours</option>
          <option value="6h">Last 6 Hours</option>
          <option value="1h">Last 1 Hour</option>
          <option value="7d">Last 7 Days</option>
        </select>

        {/* Clear Button */}
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-2 py-1 text-outline hover:text-on-surface transition-colors font-mono text-[11px] uppercase"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
          <span>Clear</span>
        </button>
      </div>

      {/* Quick Counter */}
      <div className="flex items-center justify-end font-mono text-xs text-outline border-t xl:border-t-0 xl:border-l border-outline-variant/30 pt-2 xl:pt-0 xl:pl-3 whitespace-nowrap">
        Showing <span className="text-cyan-400 font-bold mx-1">{displayedCount}</span> of{' '}
        <span className="text-on-surface font-bold ml-1">{totalCount}</span> active alerts
      </div>
    </div>
  );
}
