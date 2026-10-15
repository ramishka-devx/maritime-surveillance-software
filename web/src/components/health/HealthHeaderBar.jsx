import React from 'react';

export default function HealthHeaderBar({
  uptime = '99.98%',
  uptimeDuration = '41d 14h 22m',
  clusterName = 'US-EAST-MARITIME-01',
  refreshInterval = '10',
  onRefreshIntervalChange,
  onManualRefresh,
  isRefreshing = false,
}) {
  return (
    <header className="bg-surface-container-low rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md border border-outline-variant/30 select-none font-sans">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold uppercase tracking-tight text-on-surface m-0">
            System Health
          </h1>
          <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-cyan-400 font-mono text-xs font-semibold">
            INFRASTRUCTURE TELEMETRY // CLUSTER {clusterName}
          </span>
        </div>
        <p className="font-mono text-xs text-on-surface-variant max-w-4xl m-0 leading-relaxed">
          Live heartbeat diagnostics, telemetry pipeline latency, message broker lag, partition health, and critical node exceptions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0 font-mono text-xs">
        {/* Cluster Uptime Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 uppercase leading-none font-bold">HEALTHY</span>
            <span className="text-on-surface-variant text-[11px] leading-none mt-0.5">
              {uptime} ({uptimeDuration})
            </span>
          </div>
        </div>

        {/* Auto Refresh Interval */}
        <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          <span className="text-[10px] text-outline mr-1 font-semibold">AUTO:</span>
          <select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(e.target.value)}
            className="bg-transparent text-cyan-400 focus:outline-none cursor-pointer pr-1 text-xs"
          >
            <option className="bg-surface-container-high text-on-surface" value="5">5s</option>
            <option className="bg-surface-container-high text-on-surface" value="10">10s</option>
            <option className="bg-surface-container-high text-on-surface" value="30">30s</option>
            <option className="bg-surface-container-high text-on-surface" value="60">60s</option>
            <option className="bg-surface-container-high text-on-surface" value="0">Off</option>
          </select>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onManualRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 text-black hover:bg-cyan-300 font-bold uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[16px] transition-transform duration-500 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            sync
          </span>
          <span>Refresh Now</span>
        </button>
      </div>
    </header>
  );
}
