import React from 'react';

const RANK_STYLES = [
  { bar: 'bg-red-500',    text: 'text-red-400'    },
  { bar: 'bg-purple-400', text: 'text-purple-300' },
  { bar: 'bg-purple-400', text: 'text-purple-300' },
  { bar: 'bg-blue-400',   text: 'text-blue-300'   },
  { bar: 'bg-blue-400',   text: 'text-blue-300'   },
];

const COMPACT_COLORS = ['text-cyan-400', 'text-cyan-400', 'text-slate-300', 'text-slate-300', 'text-slate-300'];

export default function DashboardTopFlaggedVessels({ topFlaggedVessels = [], timeRange = '24h', isLoading = false, onSelectVessel }) {
  if (isLoading) {
    return (
      <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none animate-pulse">
        <div className="h-6 w-48 bg-surface-container-highest rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-container-highest rounded mb-2" />
        ))}
      </div>
    );
  }

  const top5    = topFlaggedVessels.slice(0, 5);
  const rest    = topFlaggedVessels.slice(5, 10);
  const maxCount = top5[0]?.count || 1;

  return (
    <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 bg-surface-container-lowest/50 -mx-4 -mt-4 p-4 rounded-t-lg border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">flag</span>
          <span className="text-sm font-bold text-on-surface uppercase">Top Flagged Vessels</span>
        </div>
        <span className="font-mono text-xs uppercase text-outline">({timeRange.toUpperCase()})</span>
      </div>

      {topFlaggedVessels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-outline font-mono text-xs gap-2">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
          <span>No flagged vessels in last {timeRange.toUpperCase()}</span>
        </div>
      ) : (
        <>
          {/* Top 5 Detailed Cards */}
          <div className="flex flex-col gap-2 mt-3 font-mono text-xs">
            {top5.map((v, i) => {
              const style  = RANK_STYLES[i] ?? RANK_STYLES[4];
              const barPct = `${Math.round((v.count / maxCount) * 100)}%`;
              const displayName = (v.vesselName || 'UNKNOWN VESSEL').toUpperCase();
              const flag = v.flag ? v.flag.toUpperCase() : '—';

              return (
                <div
                  key={v.mmsi ?? i}
                  onClick={() => onSelectVessel && onSelectVessel(v)}
                  className="flex flex-col gap-1 p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${style.text}`}>#{i + 1}</span>
                      <span className="font-bold text-on-surface font-sans text-xs truncate max-w-[140px]">
                        {displayName}
                      </span>
                      <span className="px-1 py-0.5 rounded bg-surface-container-highest text-outline text-[10px]">
                        {flag}
                      </span>
                    </div>
                    <span className={`font-bold ${style.text} whitespace-nowrap`}>{v.count} alerts</span>
                  </div>
                  <div className="flex items-center justify-between text-outline text-[11px]">
                    <span>MMSI: {v.mmsi || '—'}</span>
                    <div className="w-28 bg-surface-container-highest h-1.5 rounded overflow-hidden">
                      <div className={`h-full rounded ${style.bar}`} style={{ width: barPct }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Vessels 6–10 compact grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-1 font-mono text-xs">
                {rest.map((v, i) => {
                  const rank  = i + 6;
                  const color = COMPACT_COLORS[i] ?? 'text-slate-300';
                  return (
                    <div
                      key={v.mmsi ?? rank}
                      onClick={() => onSelectVessel && onSelectVessel(v)}
                      className={`p-1.5 rounded bg-surface-container flex items-center justify-between text-outline cursor-pointer hover:bg-surface-container-high transition-colors${rank === rest.length + 5 && rest.length % 2 !== 0 ? ' col-span-2' : ''}`}
                    >
                      <span className="truncate text-on-surface text-[11px]">
                        #{rank} {(v.vesselName || 'UNKNOWN').toUpperCase()}
                      </span>
                      <span className={`${color} font-bold ml-2 whitespace-nowrap`}>{v.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
