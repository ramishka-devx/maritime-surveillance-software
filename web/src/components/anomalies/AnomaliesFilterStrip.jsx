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
    <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs font-sans select-none">
      <div className="flex flex-wrap items-center gap-6">
        {/* Peer Group Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-sm border border-slate-200">
          <span className="font-mono text-[11px] uppercase text-slate-500 font-semibold">Peer Group:</span>
          <select
            value={peerGroup}
            onChange={(e) => onPeerGroupChange(e.target.value)}
            className="bg-transparent font-mono text-xs text-[#0891b2] font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL" className="bg-white text-slate-800">
              All Peer Groups (7 active)
            </option>
            <option value="Cargo, 180-250m" className="bg-white text-slate-800">
              Cargo, 180-250m
            </option>
            <option value="Tanker, 250-330m" className="bg-white text-slate-800">
              Tanker, 250-330m
            </option>
            <option value="Container, >330m" className="bg-white text-slate-800">
              Container, &gt;330m
            </option>
            <option value="Fishing, 30-60m" className="bg-white text-slate-800">
              Fishing, 30-60m
            </option>
            <option value="Bulk Carrier, 150-200m" className="bg-white text-slate-800">
              Bulk Carrier, 150-200m
            </option>
          </select>
        </div>

        {/* Time Window */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-sm border border-slate-200">
          <span className="material-symbols-outlined text-[15px] text-slate-500">schedule</span>
          <select
            value={timeWindow}
            onChange={(e) => onTimeWindowChange(e.target.value)}
            className="bg-transparent font-mono text-xs text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="24h" className="bg-white text-slate-800">
              Last 24 Hours (UTC)
            </option>
            <option value="6h" className="bg-white text-slate-800">
              Last 6 Hours
            </option>
            <option value="7d" className="bg-white text-slate-800">
              7-Day Window
            </option>
            <option value="custom" className="bg-white text-slate-800">
              Custom Mission Horizon
            </option>
          </select>
        </div>

        {/* Status Filter Segmented Buttons */}
        <div className="flex items-center bg-slate-100 rounded-sm p-0.5 border border-slate-200 font-mono text-[11px]">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusFilterChange(tab.id)}
                className={`px-2.5 py-0.5 rounded-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#0891b2] font-bold border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
          className="text-slate-500 hover:text-[#0891b2] transition-colors flex items-center gap-0.5 font-mono text-xs uppercase font-semibold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
          <span>Clear</span>
        </button>
      </div>
      <div className="flex items-center gap-1.5 p-2 py-0.5 rounded-sm bg-slate-50 border border-slate-200 font-mono text-xs">
        <span className="text-red-600 font-bold">{totalAnomalies}</span>
        <span className="text-slate-500">anomalies detected across</span>
        <span className="text-[#0891b2] font-bold">{totalTracks.toLocaleString()}</span>
        <span className="text-slate-500">active tracks</span>
      </div>
    </div>
  );
}
