import React from 'react';

export default function AnomaliesFilterStrip({
  peerGroup,
  onPeerGroupChange,
  timeWindow,
  onTimeWindowChange,
  scoreThreshold,
  onScoreThresholdChange,
  statusFilter,
  onStatusFilterChange,
  totalAnomalies = 0,
  totalTracks = 0,
  statusCounts = null,
  onResetFilters,
}) {
  const statusTabs = [
    { id: 'ALL', label: 'All', count: statusCounts?.ALL ?? totalAnomalies },
    { id: 'NEW', label: 'New', count: statusCounts?.NEW ?? 0 },
    { id: 'CONFIRMED', label: 'Confirmed', count: statusCounts?.CONFIRMED ?? 0 },
    { id: 'FALSE_POS', label: 'False Pos', count: statusCounts?.FALSE_POS ?? 0 },
  ];

  return (
    <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs font-sans select-none">
      <div className="flex flex-wrap items-center gap-6">
        {/* Peer Group Selector */}
        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/40">
          <span className="font-mono text-[11px] uppercase text-outline">Peer Group:</span>
          <select
            value={peerGroup}
            onChange={(e) => onPeerGroupChange(e.target.value)}
            className="bg-transparent font-mono text-xs text-cyan-400 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL" className="bg-[#0b1220] text-slate-200">
              All Peer Groups (7 active)
            </option>
            <option value="Cargo, 180-250m" className="bg-[#0b1220] text-slate-200">
              Cargo, 180-250m
            </option>
            <option value="Tanker, 250-330m" className="bg-[#0b1220] text-slate-200">
              Tanker, 250-330m
            </option>
            <option value="Container, >330m" className="bg-[#0b1220] text-slate-200">
              Container, &gt;330m
            </option>
            <option value="Fishing, 30-60m" className="bg-[#0b1220] text-slate-200">
              Fishing, 30-60m
            </option>
            <option value="Bulk Carrier, 150-200m" className="bg-[#0b1220] text-slate-200">
              Bulk Carrier, 150-200m
            </option>
          </select>
        </div>

        {/* Time Window */}
        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/40">
          <span className="material-symbols-outlined text-[15px] text-outline">schedule</span>
          <select
            value={timeWindow}
            onChange={(e) => onTimeWindowChange(e.target.value)}
            className="bg-transparent font-mono text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="24h" className="bg-[#0b1220] text-slate-200">
              Last 24 Hours (UTC)
            </option>
            <option value="6h" className="bg-[#0b1220] text-slate-200">
              Last 6 Hours
            </option>
            <option value="7d" className="bg-[#0b1220] text-slate-200">
              7-Day Window
            </option>
            <option value="custom" className="bg-[#0b1220] text-slate-200">
              Custom Mission Horizon
            </option>
          </select>
        </div>

        {/* Status Filter Segmented Buttons */}
        <div className="flex items-center bg-surface-container-lowest rounded p-0.5 border border-outline-variant/30 font-mono text-[11px]">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusFilterChange(tab.id)}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-cyan-400 font-bold border border-cyan-400/30 shadow-[0_0_6px_rgba(34,211,238,0.2)]'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Pill & Reset */}
      <div className="flex items-center gap-3 pr-3 ml-auto">
        <button
          onClick={onResetFilters}
          className="text-outline hover:text-cyan-400 transition-colors flex items-center gap-0.5 font-mono text-xs uppercase font-semibold"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
          <span>Clear</span>
        </button>
      </div>
        <div className="flex items-center gap-1.5 p-2 py-0.5 rounded bg-surface-container-highest/60 border border-outline-variant/40 font-mono text-xs">
          <span className="text-red-400 font-bold">{totalAnomalies}</span>
          <span className="text-outline">anomalies detected across</span>
          <span className="text-cyan-400 font-bold">{totalTracks.toLocaleString()}</span>
          <span className="text-outline">active tracks</span>
        </div>
    </div>
  );
}
