import React, { useState } from 'react';

export default function AlertsHeader({
  onAcknowledgeSelected,
  selectedCount = 0,
  onExportCsv,
}) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const handleAck = () => {
    if (selectedCount === 0) {
      alert('Please select one or more alerts from the queue below to acknowledge.');
      return;
    }
    if (onAcknowledgeSelected) {
      onAcknowledgeSelected();
    }
  };

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      alert('Exporting alerts queue log to CSV...');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-outline-variant/30 font-sans select-none">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-on-surface tracking-tight uppercase">
            Alerts Queue
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high border border-cyan-400/40">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold tracking-wider text-cyan-400 uppercase">
            LIVE RADAR FEED // DEFCON 3
          </span>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Auto Refresh Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant/30 text-outline">
          <span className="material-symbols-outlined text-[15px] text-emerald-400">sync</span>
          <span>
            Auto-refresh: <span className="text-on-surface font-semibold">5s</span>
          </span>
        </div>

        {/* Export CSV Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface text-xs font-semibold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-outline">download</span>
          <span>Export CSV</span>
        </button>

        {/* Acknowledge Button */}
        <button
          onClick={handleAck}
          className={`flex items-center gap-1 px-3 py-1.5 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
            selectedCount > 0
              ? 'bg-cyan-400 text-slate-950 hover:brightness-110 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
              : 'bg-surface-container-high border border-outline-variant/40 text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">done_all</span>
          <span>Acknowledge Selected {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
        </button>
      </div>
    </div>
  );
}