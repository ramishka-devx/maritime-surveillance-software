import React from 'react';

export default function RestrictedAreasSidebar({
  zones = [],
  allZones = [],
  selectedZoneId,
  onSelectZone,
  activeFilter = 'all',
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  onToggleZoneStatus,
  onSetZoneExpiry,
  onDeleteZone,
  incursionCount: liveIncursionCount,
  onUploadGeoJson,
  onNewArea,
  isLoading = false,
  onRefresh,
}) {
  const baseList = allZones.length > 0 ? allZones : zones;

  const militaryCount = baseList.filter((z) => (z.type || '').toLowerCase().includes('milit')).length;
  const sanctuaryCount = baseList.filter((z) => (z.type || '').toLowerCase().includes('sanct')).length;
  const portCount = baseList.filter(
    (z) => (z.type || '').toLowerCase().includes('port') || (z.type || '').toLowerCase().includes('anchor')
  ).length;
  const cableCount = baseList.filter((z) => (z.type || '').toLowerCase().includes('cable')).length;
  const incursionCount = liveIncursionCount ?? baseList.reduce((sum, z) => sum + (z.incursions || 0), 0);
  const activeCount = baseList.filter((z) => z.active !== false).length;

  const filterTabs = [
    { id: 'all', label: `All (${baseList.length})` },
    { id: 'military', label: `Military (${militaryCount})` },
    { id: 'sanctuary', label: `Sanctuary (${sanctuaryCount})` },
    { id: 'port', label: `Port (${portCount})` },
    { id: 'cable', label: `Cable (${cableCount})` },
    { id: 'incursion', label: `Incursions (${incursionCount})`, hasBadge: incursionCount > 0 },
  ];

  return (
    <aside className="w-[380px] shrink-0 bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-20 shadow-xl font-sans select-none h-full">
      {/* Panel Header & Action Bar */}
      <div className="p-4 pt-3 border-b border-outline-variant/30 bg-surface-container-lowest/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight uppercase text-on-surface m-0">
              Restricted Areas
            </h1>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-cyan-400 font-mono text-xs font-bold border border-cyan-400/30">
            <span className="text-emerald-400">{activeCount} Active</span>
          </span>
        </div>

        <p className="font-mono text-xs text-outline m-0">
          Geofenced maritime boundaries &amp; exclusion corridors
        </p>

        {/* Search & Upload GeoJSON Button */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search zones, categories..."
              className="w-full bg-surface-container border border-outline-variant/40 rounded pl-3.5 pr-8 py-1.5 text-on-surface font-mono text-xs placeholder:text-outline focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1.5 text-outline hover:text-cyan-400 p-0.5 rounded transition-colors flex items-center justify-center cursor-pointer"
                title="Clear Search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            ) : (
              <span className="absolute right-2 top-1.5 text-outline p-0.5 flex items-center justify-center pointer-events-none">
                <span className="material-symbols-outlined text-[16px]">search</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onUploadGeoJson || onNewArea}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all font-mono text-xs font-bold uppercase shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
            title="Upload GeoJSON boundary definition file (.geojson, .json)"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Upload GeoJSON</span>
          </button>
        </div>

        {/* Type / Category Filter Pills */}
        <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-cyan-400 border border-cyan-400/40 font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-outline hover:text-white border border-transparent'
                }`}
              >
                {tab.hasBadge && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Zone Roster */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20 p-2 space-y-1.5">
        {isLoading ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2.5 font-mono text-xs text-outline">
            <span className="material-symbols-outlined text-2xl text-cyan-400 animate-spin">
              progress_activity
            </span>
            <span>Loading zones from database...</span>
          </div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3 font-mono text-xs text-outline">
            <span className="material-symbols-outlined text-3xl text-outline/60">
              travel_explore
            </span>
            <p className="m-0">No restricted areas match current criteria.</p>
            <button
              type="button"
              onClick={onUploadGeoJson || onNewArea}
              className="mt-2 px-3 py-1.5 rounded bg-cyan-400 text-slate-950 font-bold uppercase text-[11px] hover:bg-cyan-300 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              <span>Upload GeoJSON</span>
            </button>
          </div>
        ) : (
          zones.map((zone) => {
            const isSelected = String(selectedZoneId) === String(zone.id);

            return (
              <div
                key={zone.id || zone.name}
                onClick={() => onSelectZone(zone)}
                className={`group relative p-3 rounded cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-container-high/90 border-l-4 border-l-cyan-400 border border-cyan-400/30 shadow-md'
                    : 'bg-surface-container-lowest/50 hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex flex-col">
                    <span
                      className={`font-mono text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                        isSelected ? 'text-cyan-400' : 'text-on-surface group-hover:text-cyan-400'
                      }`}
                    >
                      {zone.incursions > 0 && (
                        <span className="material-symbols-outlined text-[15px] text-red-400">
                          warning
                        </span>
                      )}
                      {zone.name}
                    </span>
                    <span className="font-mono text-[11px] text-outline mt-0.5">
                      {zone.sector}
                    </span>
                  </div>

                  {/* Status Toggle Switch */}
                  <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteZone?.(zone.id); }} title="Delete restricted area" className="mr-2 text-outline hover:text-red-400" aria-label={`Delete ${zone.name}`}>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={zone.active !== false}
                      onChange={() => onToggleZoneStatus && onToggleZoneStatus(zone.id)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-950 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                  </label>
                </div>

                <label className="mt-2 flex items-center gap-2 font-mono text-[10px] text-outline" onClick={(e) => e.stopPropagation()}>
                  <span>Expires</span>
                  <input type="datetime-local" value={zone.expires_at ? new Date(zone.expires_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => onSetZoneExpiry?.(zone.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="min-w-0 rounded border border-outline-variant/40 bg-surface-container px-1.5 py-1 text-[10px] text-on-surface" />
                </label>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap font-mono text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border flex items-center gap-1 ${
                      zone.badgeType === 'military'
                        ? 'bg-red-950/70 text-red-400 border-red-500/50'
                        : zone.badgeType === 'cable'
                        ? 'bg-amber-950/70 text-amber-400 border-amber-500/40'
                        : zone.badgeType === 'marine'
                        ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                        : 'bg-cyan-950/70 text-cyan-400 border-cyan-500/40'
                    }`}
                  >
                    {zone.incursions > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                    {zone.category}
                  </span>

                  {zone.incursions > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-red-950/50 text-red-400 font-bold border border-red-500/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">gavel</span>
                      {zone.incursions} incursion{zone.incursions > 1 ? 's' : ''} (24h)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline">
                      0 incursions (24h)
                    </span>
                  )}
                </div>

                {/* Area & Constraints */}
                <div className="mt-2 font-mono text-[11px] text-outline flex items-center justify-between border-t border-outline-variant/20 pt-1.5">
                  <span>
                    Area: {zone.area} • {zone.vertices || (zone.coordinates?.length || 0)} vertices
                  </span>
                  <span className={zone.constraintColor || 'text-cyan-400'}>
                    {zone.constraint}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Left Panel Bottom Quick Metric Bar */}
      <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-outline">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>AIS GEOFENCE MONITOR: ACTIVE</span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-1 text-outline hover:text-cyan-400 transition-colors cursor-pointer"
          title="Reload restricted areas from database"
        >
          <span className="material-symbols-outlined text-[16px]">sync</span>
        </button>
      </div>
    </aside>
  );
}
