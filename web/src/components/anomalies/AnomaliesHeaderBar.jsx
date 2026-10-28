import React from 'react';

export default function AnomaliesHeaderBar({ onExport, onOpenSettings }) {
  return (
    <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-y-3 font-sans select-none">
      {/* Title & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
            Anomalies Explorer
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-slate-50 border border-slate-200 text-slate-600">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">sync</span>
          <span className="font-mono text-xs">
            Auto-eval: <span className="text-slate-900 font-semibold">30s</span>
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#0891b2] text-slate-700 hover:text-slate-900 transition-all text-xs font-medium shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px] text-slate-500">tune</span>
          <span>Model Settings (v3.4-alpha)</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold uppercase transition-all shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">file_download</span>
          <span>Export Inferences</span>
        </button>
      </div>
    </div>
  );
}
