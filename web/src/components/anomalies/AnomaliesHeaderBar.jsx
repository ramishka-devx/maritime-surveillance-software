import React from 'react';

export default function AnomaliesHeaderBar({ onExport, onOpenSettings }) {
  return (
    <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface-container-lowest/80 flex flex-wrap items-center justify-between gap-y-3 font-sans select-none">
      {/* Title & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-on-surface tracking-tight uppercase">
            Anomalies Explorer
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 text-outline">
          <span className="material-symbols-outlined text-[15px] text-emerald-400">sync</span>
          <span className="font-mono text-xs">
            Auto-eval: <span className="text-on-surface font-semibold">30s</span>
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 hover:border-cyan-400/50 text-outline hover:text-on-surface transition-all text-xs font-medium"
        >
          <span className="material-symbols-outlined text-[15px]">tune</span>
          <span>Model Settings (v3.4-alpha)</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)]"
        >
          <span className="material-symbols-outlined text-[15px]">file_download</span>
          <span>Export Inferences</span>
        </button>
      </div>
    </div>
  );
}
