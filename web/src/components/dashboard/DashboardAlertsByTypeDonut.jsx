import React, { useMemo } from 'react';

const TYPE_MAPPINGS = [
  { key: 'geofence', label: 'Restricted Area Incursion', color: '#c084fc', colorDot: 'bg-purple-400' },
  { key: 'speed', label: 'Speed / Course Anomaly', color: '#22d3ee', colorDot: 'bg-cyan-400' },
  { key: 'collision_risk', label: 'Collision Risk (CPA < 0.2NM)', color: '#34d399', colorDot: 'bg-emerald-400' },
  { key: 'dark_vessel', label: 'Dark Vessel / AIS Lost', color: '#60a5fa', colorDot: 'bg-blue-400' },
  { key: 'manual', label: 'Manual Report', color: '#fbbf24', colorDot: 'bg-amber-400' },
];

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DashboardAlertsByTypeDonut({ incidentTypes = [], timeRange = '24h', isLoading = false }) {
  const categories = useMemo(() => {
    if (!incidentTypes.length) return [];

    const total = incidentTypes.reduce((sum, t) => sum + (t.count || 0), 0);
    if (total === 0) return [];

    const mapped = TYPE_MAPPINGS.map((mapping) => {
      const match = incidentTypes.find((t) => t.type === mapping.key);
      const count = match?.count || 0;
      return {
        ...mapping,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }).filter((c) => c.count > 0);

    const otherCount = incidentTypes
      .filter((t) => !TYPE_MAPPINGS.some((m) => m.key === t.type))
      .reduce((sum, t) => sum + (t.count || 0), 0);

    if (otherCount > 0) {
      mapped.push({
        key: 'other',
        label: 'Other Incidents',
        color: '#94a3b8',
        colorDot: 'bg-slate-400',
        count: otherCount,
        pct: total > 0 ? Math.round((otherCount / total) * 100) : 0,
      });
    }

    return mapped;
  }, [incidentTypes]);

  const totalCount = useMemo(() => categories.reduce((sum, c) => sum + c.count, 0), [categories]);

  const segments = useMemo(() => {
    let offset = 0;
    return categories.map((cat) => {
      const dashLength = (cat.pct / 100) * CIRCUMFERENCE;
      const segment = { ...cat, dashLength, offset };
      offset += dashLength;
      return segment;
    });
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none animate-pulse">
        <div className="h-6 w-40 bg-surface-container-highest rounded mb-4" />
        <div className="h-44 w-44 mx-auto rounded-full bg-surface-container-highest" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none">
      <div className="flex items-center justify-between pb-3 bg-surface-container-lowest/50 -mx-4 -mt-4 p-4 rounded-t-lg border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">
            donut_large
          </span>
          <span className="text-sm font-bold text-on-surface uppercase">
            Alerts By Type
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-xs font-semibold">
          N={totalCount} ({timeRange.toUpperCase()})
        </span>
      </div>

      <div className="flex items-center justify-center my-3 relative">
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#19202e"
            strokeWidth="12"
          />
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-2xl font-bold text-on-surface leading-none">
            {totalCount}
          </span>
          <span className="font-mono text-[10px] uppercase text-outline tracking-wider mt-1">
            {timeRange.toUpperCase()} Incidents
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-1 font-mono text-xs">
        {categories.map((cat) => (
          <div
            key={cat.key}
            className="flex items-center justify-between p-1.5 rounded bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${cat.colorDot}`} />
              <span className="text-on-surface font-sans text-xs">{cat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-on-surface font-bold">{cat.count}</span>
              <span className="text-outline">{cat.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
