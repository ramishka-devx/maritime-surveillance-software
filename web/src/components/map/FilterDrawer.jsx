import React, { useMemo } from 'react';
import { getVesselCategory, getVesselThreat } from './MapCanvas.jsx';

const DEFAULT_FILTERS = {
  types: ['cargo', 'tanker', 'passenger', 'fishing', 'special'],
  threats: ['critical', 'warning', 'normal'],
  minSpeed: 0,
  maxSpeed: 35,
};

export default function FilterDrawer({
  isOpen = false,
  onToggle,
  filters = DEFAULT_FILTERS,
  onFilterChange,
  vessels = [],
  filteredCount,
}) {
  const currentFilters = filters || DEFAULT_FILTERS;
  const selectedTypes = currentFilters.types || DEFAULT_FILTERS.types;
  const selectedThreats = currentFilters.threats || DEFAULT_FILTERS.threats;
  const minSpeed = currentFilters.minSpeed ?? 0;
  const maxSpeed = currentFilters.maxSpeed ?? 35;

  const updateFilters = (next) => {
    if (onFilterChange) {
      onFilterChange(next);
    }
  };

  const totalCount = vessels?.length || 0;
  const shownCount = filteredCount !== undefined ? filteredCount : totalCount;

  // Dynamic Fleet Counts per Category
  const categoryCounts = useMemo(() => {
    const counts = { cargo: 0, tanker: 0, passenger: 0, fishing: 0, special: 0 };
    (vessels || []).forEach((v) => {
      const cat = getVesselCategory(v);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.special++;
      }
    });
    return counts;
  }, [vessels]);

  // Dynamic Fleet Counts per Threat Level
  const threatCounts = useMemo(() => {
    const counts = { critical: 0, warning: 0, normal: 0 };
    (vessels || []).forEach((v) => {
      const th = getVesselThreat(v);
      if (counts[th] !== undefined) {
        counts[th]++;
      } else {
        counts.normal++;
      }
    });
    return counts;
  }, [vessels]);

  const suspiciousCount = (threatCounts.critical || 0) + (threatCounts.warning || 0);

  const highSpeedCount = useMemo(() => {
    return (vessels || []).filter((v) => {
      const spd =
        typeof v.speed === 'number'
          ? v.speed
          : parseFloat(v.speed || v.sog || 0) || 0;
      return spd >= 18;
    }).length;
  }, [vessels]);

  const vesselCategories = [
    { id: 'cargo', label: 'Cargo Vessels', color: '#3b82f6', count: categoryCounts.cargo },
    { id: 'tanker', label: 'Tankers / Hazmat', color: '#f59e0b', count: categoryCounts.tanker },
    { id: 'passenger', label: 'Ferries & Passenger', color: '#38bdf8', count: categoryCounts.passenger },
    { id: 'fishing', label: 'Fishing Vessels', color: '#10b981', count: categoryCounts.fishing },
    { id: 'special', label: 'Tug & Special Ops', color: '#a855f7', count: categoryCounts.special },
  ];

  const threatLevels = [
    { id: 'critical', label: 'CRITICAL', color: 'border-red-500/60 text-red-400 bg-red-950/40', count: threatCounts.critical },
    { id: 'warning', label: 'WARNING', color: 'border-amber-500/60 text-amber-400 bg-amber-950/40', count: threatCounts.warning },
    { id: 'normal', label: 'NORMAL', color: 'border-cyan-500/60 text-cyan-400 bg-cyan-950/40', count: threatCounts.normal },
  ];

  const toggleType = (id) => {
    const nextTypes = selectedTypes.includes(id)
      ? selectedTypes.filter((t) => t !== id)
      : [...selectedTypes, id];
    updateFilters({ ...currentFilters, types: nextTypes });
  };

  const toggleThreat = (id) => {
    const nextThreats = selectedThreats.includes(id)
      ? selectedThreats.filter((t) => t !== id)
      : [...selectedThreats, id];
    updateFilters({ ...currentFilters, threats: nextThreats });
  };

  const applyPreset = (preset) => {
    if (preset === 'all') {
      updateFilters({
        types: ['cargo', 'tanker', 'passenger', 'fishing', 'special'],
        threats: ['critical', 'warning', 'normal'],
        minSpeed: 0,
        maxSpeed: 35,
      });
    } else if (preset === 'suspicious') {
      updateFilters({
        ...currentFilters,
        threats: ['critical', 'warning'],
      });
    } else if (preset === 'high-speed') {
      updateFilters({
        ...currentFilters,
        minSpeed: 18.0,
        maxSpeed: 35.0,
      });
    }
  };

  const activeCount = selectedTypes.length + selectedThreats.length;

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-64 top-20 z-30 flex items-center gap-2 px-3 py-2 bg-surface-container-low/90 backdrop-blur-md border border-outline-variant/40 rounded text-xs font-mono text-cyan-400 hover:bg-surface-container hover:border-cyan-500/50 shadow-xl transition-all"
        title="Open Filter Drawer"
      >
        <span className="material-symbols-outlined text-[16px]">tune</span>
        <span>FILTERS ({shownCount} / {totalCount})</span>
      </button>
    );
  }

  return (
    <div className="fixed left-64 top-20 bottom-16 w-80 bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/40 rounded-lg shadow-2xl z-30 flex flex-col font-sans overflow-hidden transition-all duration-300">
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/80">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">Target Filters</h2>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-400">
            {activeCount} ACTIVE
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors"
          title="Collapse Panel"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
      </div>

      {/* Drawer Body Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Quick Presets */}
        <div>
          <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-2 flex justify-between">
            <span>Quick Presets</span>
            <button
              onClick={() => applyPreset('all')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
            <button
              onClick={() => applyPreset('all')}
              className="py-1 px-2 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-cyan-500/40 text-on-surface text-center"
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => applyPreset('suspicious')}
              className="py-1 px-2 rounded bg-surface-container-lowest border border-red-500/30 text-red-400 hover:border-red-500/60 text-center"
            >
              Suspicious ({suspiciousCount})
            </button>
            <button
              onClick={() => applyPreset('high-speed')}
              className="py-1 px-2 rounded bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/40 text-amber-300 text-center"
            >
              &gt; 18 KTS ({highSpeedCount})
            </button>
          </div>
        </div>

        {/* Threat Level */}
        <div>
          <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-2">
            Threat Classification
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
            {threatLevels.map((lvl) => {
              const active = selectedThreats.includes(lvl.id);
              return (
                <button
                  key={lvl.id}
                  onClick={() => toggleThreat(lvl.id)}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    active
                      ? lvl.color
                      : 'border-outline-variant/20 bg-surface-container-lowest text-outline opacity-60'
                  }`}
                >
                  <div className="font-bold">{lvl.label}</div>
                  <div className="text-[9px] opacity-75">{lvl.count} targets</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vessel Category Toggles */}
        <div>
          <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-2">
            Vessel Categories
          </div>
          <div className="space-y-1.5">
            {vesselCategories.map((cat) => {
              const active = selectedTypes.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleType(cat.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer border transition-colors ${
                    active
                      ? 'bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant'
                      : 'bg-surface-container-lowest/40 border-transparent opacity-50 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-on-surface font-medium">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-outline">{cat.count}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleType(cat.id)}
                      className="rounded bg-surface-container-highest border-outline-variant text-cyan-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SOG Speed Filter */}
        <div>
          <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-2 flex justify-between">
            <span>Speed Over Ground (SOG)</span>
            <span className="text-cyan-400 font-mono">
              {minSpeed.toFixed(1)} - {maxSpeed.toFixed(1)} KTS
            </span>
          </div>
          <div className="px-1">
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={maxSpeed}
              onChange={(e) =>
                updateFilters({
                  ...currentFilters,
                  maxSpeed: parseFloat(e.target.value),
                })
              }
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between font-mono text-[9px] text-outline mt-1">
              <span>{minSpeed > 0 ? `${minSpeed.toFixed(0)} KTS` : '0 KTS'}</span>
              <span>15 KTS</span>
              <span>35 KTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Footer Status */}
      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-lowest/90 font-mono text-[10px] text-outline flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>FILTER APPLIED</span>
        </div>
        <span>
          {shownCount} / {totalCount} SHOWN
        </span>
      </div>
    </div>
  );
}
