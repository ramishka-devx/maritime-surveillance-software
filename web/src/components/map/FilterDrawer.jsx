import React, { useMemo } from 'react';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { VESSEL_TYPES, getVesselCategory, getVesselThreat } from './vesselCanvasLayer.js';

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

  const vesselCategories = VESSEL_TYPES.map((t) => ({ ...t, count: categoryCounts[t.id] }));

  const threatLevels = [
    { id: 'critical', label: 'Critical', on: 'border-bs-accent-2 bg-bs-accent-2-100 text-bs-accent-2-700', count: threatCounts.critical },
    { id: 'warning', label: 'Warning', on: 'border-bs-accent-2-500 bg-bs-accent-2-100 text-bs-accent-2-700', count: threatCounts.warning },
    { id: 'normal', label: 'Normal', on: 'border-bs-ink bg-bs-surface text-bs-ink', count: threatCounts.normal },
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
        className="absolute left-6 top-5 z-30 inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-sm border border-bs-ink/[.16] bg-bs-bg shadow-bs-sm text-[13px] font-semibold text-bs-ink hover:bg-bs-surface outline-none focus-visible:outline-bs-accent"
        title="Open filters"
      >
        <SlidersHorizontal size={16} />
        Filters
        <span className="font-normal text-bs-neutral-700 tabular-nums">{shownCount}</span>
      </button>
    );
  }

  const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700 mb-2';
  const chip = 'py-1.5 px-2 rounded-sm border text-[12px] text-center';

  return (
    <div className="absolute left-6 top-5 bottom-5 w-80 z-30 flex flex-col bg-bs-bg text-bs-ink shadow-bs-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-semibold text-[17px]">Filters</h2>
          <span className="text-[12px] italic text-bs-neutral-700">{activeCount} active</span>
        </div>
        <button
          onClick={onToggle}
          className="w-8 h-8 grid place-items-center rounded-sm text-bs-neutral-700 hover:bg-bs-ink/[.07] outline-none focus-visible:outline-bs-accent"
          aria-label="Close filters"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6 text-[13px]">
        {/* Quick presets */}
        <div>
          <div className={`${kicker} flex justify-between`}>
            <span>Quick presets</span>
            <button onClick={() => applyPreset('all')} className="normal-case tracking-normal text-[12px] text-bs-accent-700 underline underline-offset-[3px]">
              Reset all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => applyPreset('all')} className={`${chip} border-bs-ink/[.16] hover:bg-bs-ink/[.07]`}>
              All <span className="text-bs-neutral-700">{totalCount}</span>
            </button>
            <button onClick={() => applyPreset('suspicious')} className={`${chip} border-bs-accent-2 text-bs-accent-2-700 hover:bg-bs-accent-2-100`}>
              Suspicious {suspiciousCount}
            </button>
            <button onClick={() => applyPreset('high-speed')} className={`${chip} border-bs-ink/[.16] hover:bg-bs-ink/[.07]`}>
              &gt; 18 kn <span className="text-bs-neutral-700">{highSpeedCount}</span>
            </button>
          </div>
        </div>

        {/* Threat level */}
        <div>
          <div className={kicker}>Threat level</div>
          <div className="grid grid-cols-3 gap-1.5">
            {threatLevels.map((lvl) => {
              const active = selectedThreats.includes(lvl.id);
              return (
                <button
                  key={lvl.id}
                  onClick={() => toggleThreat(lvl.id)}
                  aria-pressed={active}
                  className={`${chip} ${active ? lvl.on : 'border-bs-ink/[.16] text-bs-neutral-700 opacity-60'}`}
                >
                  <div className="font-semibold">{lvl.label}</div>
                  <div className="text-[11px] italic">{lvl.count} vessels</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vessel categories */}
        <div>
          <div className={kicker}>Vessel type</div>
          <div className="divide-y divide-bs-ink/[.08]">
            {vesselCategories.map((cat) => {
              const active = selectedTypes.includes(cat.id);
              return (
                <label key={cat.id} className="flex items-center gap-2.5 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleType(cat.id)}
                    className="h-4 w-4 cursor-pointer accent-bs-accent"
                  />
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                  <span className={`flex-1 ${active ? '' : 'text-bs-neutral-700'}`}>{cat.label}</span>
                  <span className="tabular-nums text-bs-neutral-700">{cat.count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Speed */}
        <div>
          <div className={`${kicker} flex justify-between`}>
            <span>Speed over ground</span>
            <span className="normal-case tracking-normal font-mono text-bs-ink tabular-nums">
              {minSpeed.toFixed(1)}–{maxSpeed.toFixed(1)} kn
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="35"
            step="0.5"
            value={maxSpeed}
            onChange={(e) => updateFilters({ ...currentFilters, maxSpeed: parseFloat(e.target.value) })}
            aria-label="Maximum speed"
            className="w-full cursor-pointer accent-bs-accent"
          />
          <div className="flex justify-between text-[11px] text-bs-neutral-700 mt-1 tabular-nums">
            <span>{minSpeed > 0 ? `${minSpeed.toFixed(0)} kn` : '0 kn'}</span>
            <span>15 kn</span>
            <span>35 kn</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-bs-ink/[.16] text-[12px] italic text-bs-neutral-700 tabular-nums">
        {shownCount} of {totalCount} vessels shown
      </div>
    </div>
  );
}
