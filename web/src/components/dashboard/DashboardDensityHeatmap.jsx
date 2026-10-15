import React from 'react';

const SECTOR_STYLES = [
  { bar: 'bg-red-500',    text: 'text-red-400',     dot: 'bg-red-500',     ring: 'ring-red-500/30',    label: 'text-red-300',    border: 'border-red-500/30'   },
  { bar: 'bg-purple-400', text: 'text-purple-300',  dot: 'bg-blue-400',    ring: 'ring-blue-500/30',   label: 'text-blue-300',   border: 'border-blue-500/30'  },
  { bar: 'bg-cyan-400',   text: 'text-cyan-300',    dot: 'bg-cyan-400',    ring: '',                   label: 'text-cyan-300',   border: 'border-cyan-500/30'  },
  { bar: 'bg-emerald-400',text: 'text-emerald-300', dot: 'bg-emerald-400', ring: '',                   label: 'text-emerald-300',border: 'border-emerald-500/30'},
];

export default function DashboardDensityHeatmap({ sectorDensity = [], timeRange = '24h', isLoading = false }) {
  if (isLoading) {
    return (
      <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none animate-pulse">
        <div className="h-6 w-40 bg-surface-container-highest rounded mb-4" />
        <div className="h-36 bg-surface-container-highest rounded mb-4" />
        <div className="h-24 bg-surface-container-highest rounded" />
      </div>
    );
  }

  const hasData = sectorDensity.length > 0;
  const topSector = sectorDensity[0] ?? null;
  const totalVessels = sectorDensity.reduce((s, r) => s + r.count, 0);

  return (
    <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 bg-surface-container-lowest/50 -mx-4 -mt-4 p-4 rounded-t-lg border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">radar</span>
          <span className="text-sm font-bold text-on-surface uppercase">Density Heatmap</span>
        </div>
        <span className="font-mono text-xs text-emerald-400 font-semibold tracking-wider">
          {hasData ? `${totalVessels} VESSELS (${timeRange.toUpperCase()})` : 'NO DATA'}
        </span>
      </div>

      {/* Mini Heatmap Radar Graphic */}
      <div className="relative w-full h-36 bg-surface-container-lowest rounded overflow-hidden mt-3 flex items-center justify-center border border-outline-variant/20">
        <svg className="absolute inset-0 w-full h-full text-slate-700/80" fill="none" stroke="currentColor">
          <defs>
            <radialGradient cx="55%" cy="45%" id="heat-dover" r="35%">
              <stop offset="0%" stopColor="#ffb4ab" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#93000a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#070e1c" stopOpacity="0" />
            </radialGradient>
            <radialGradient cx="30%" cy="70%" id="heat-capgris" r="28%">
              <stop offset="0%" stopColor="#adc6ff" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#0566d9" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#070e1c" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Graticule & shipping lanes */}
          <path d="M 0,40 Q 60,35 120,50 T 240,65 T 320,40" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1" />
          <path d="M 0,80 Q 70,85 150,75 T 280,95 T 320,80" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="160" cy="72" r="50" stroke="currentColor" strokeDasharray="3 3" strokeWidth="0.75" />
          <circle cx="160" cy="72" r="25" stroke="currentColor" strokeWidth="0.75" />
          {/* Heat glows */}
          <rect fill="url(#heat-dover)" height="100%" width="100%" x="0" y="0" />
          <rect fill="url(#heat-capgris)" height="100%" width="100%" x="0" y="0" />
        </svg>

        {/* Top hotspot marker */}
        {topSector && (
          <div className="absolute left-1/2 top-1/3 flex flex-col items-center pointer-events-none transform -translate-x-1/2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-red-500/30 animate-pulse" />
            <span className="font-mono text-[9px] text-red-300 font-bold bg-slate-950/80 px-1 py-0.5 rounded mt-0.5 border border-red-500/30 whitespace-nowrap">
              {topSector.sector.toUpperCase()} HIGH ({topSector.percentage}%)
            </span>
          </div>
        )}

        {/* Second sector marker */}
        {sectorDensity[1] && (
          <div className="absolute left-1/4 bottom-4 flex flex-col items-center pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="font-mono text-[8px] text-blue-300 bg-slate-950/80 px-1 py-0.5 rounded mt-0.5 border border-blue-500/30 whitespace-nowrap">
              {sectorDensity[1].sector.replace(/[- ]/g, ' ').toUpperCase().slice(0, 10)} ({sectorDensity[1].percentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Density Breakdown Metrics */}
      <div className="flex flex-col gap-2 mt-3 font-mono text-xs">
        {hasData ? (
          sectorDensity.map((r, i) => {
            const style = SECTOR_STYLES[i] ?? SECTOR_STYLES[3];
            return (
              <div key={r.sector} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="text-[11px] font-sans">{r.sector}</span>
                  <span className={`font-bold text-[11px] ${style.text}`}>
                    {r.percentage}% ({r.count})
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded overflow-hidden">
                  <div className={`h-full rounded ${style.bar}`} style={{ width: `${r.percentage}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-outline text-xs py-4">No AIS position data</div>
        )}
      </div>
    </div>
  );
}
