import React from 'react';

export default function AlertsMetricsChips({ metrics }) {
  const data = metrics || {
    open: { count: 24, label: 'active' },
    acknowledged: { count: 11, label: 'in-triage' },
    resolvedToday: { count: 37, label: 'cleared' },
    critical: { count: 3, label: 'urgent' },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
      {/* Metric 1: Open */}
      <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded border border-outline-variant/30 hover:border-cyan-400/40 transition-colors">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/20" />
          <span className="text-xs uppercase tracking-wider text-outline font-semibold">Open</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-bold text-on-surface">{data.open.count}</span>
          <span className="font-mono text-[10px] text-outline">{data.open.label}</span>
        </div>
      </div>

      {/* Metric 2: Acknowledged */}
      <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/20" />
          <span className="text-xs uppercase tracking-wider text-outline font-semibold">Acknowledged</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-bold text-amber-300">{data.acknowledged.count}</span>
          <span className="font-mono text-[10px] text-outline">{data.acknowledged.label}</span>
        </div>
      </div>

      {/* Metric 3: Resolved Today */}
      <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          <span className="text-xs uppercase tracking-wider text-outline font-semibold">Resolved Today</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-bold text-emerald-400">{data.resolvedToday.count}</span>
          <span className="font-mono text-[10px] text-emerald-400/70">{data.resolvedToday.label}</span>
        </div>
      </div>

      {/* Metric 4: Critical Urgency */}
      <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded border border-red-500/40 hover:border-red-500 transition-all shadow-[0_0_12px_rgba(239,68,68,0.15)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs uppercase tracking-wider text-red-400 font-bold">Critical</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-bold text-red-400">
            {String(data.critical.count).padStart(2, '0')}
          </span>
          <span className="font-mono text-[10px] text-red-400/80 uppercase">{data.critical.label}</span>
        </div>
      </div>
    </div>
  );
}
