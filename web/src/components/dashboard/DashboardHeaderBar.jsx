import React from 'react';

export default function DashboardHeaderBar({
  timeRange,
  onTimeRangeChange,
  onExportReport,
  lastSynced,
}) {
  const timeRanges = ['24h', '7d', '30d'];

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 font-sans select-none">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-on-surface uppercase">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Time Pills */}
        <div className="flex items-center bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
          {timeRanges.map((range) => {
            const isActive = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 rounded font-mono text-xs uppercase font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                    : 'text-outline hover:text-white hover:bg-surface-container'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={onExportReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold uppercase shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">file_download</span>
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
}
