import React from 'react';

export default function AlertsBulkActionBar({
  selectedCount = 0,
  onAcknowledgeSelected,
  onAssignOperator,
  onEscalateDefcon,
  onMarkFalsePositive,
  onDeselectAll,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-high rounded border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] animate-fadeIn select-none font-sans">
      <div className="flex items-center gap-3">
        <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-surface-container-lowest border border-cyan-400/30">
          {selectedCount} alert{selectedCount === 1 ? '' : 's'} selected
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onAcknowledgeSelected}
          className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-400 text-slate-950 font-mono text-xs uppercase font-bold hover:brightness-110 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[14px]">check</span>
          <span>Acknowledge (A)</span>
        </button>

        <button
          onClick={onAssignOperator}
          className="flex items-center gap-1 px-3 py-1 rounded bg-surface-container border border-outline-variant hover:border-cyan-400 text-on-surface font-mono text-xs uppercase transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] text-cyan-400">person_add</span>
          <span>Assign Operator</span>
        </button>

        <button
          onClick={onEscalateDefcon}
          className="flex items-center gap-1 px-3 py-1 rounded bg-surface-container border border-red-500/50 hover:bg-red-950/60 text-red-400 font-mono text-xs uppercase font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">warning</span>
          <span>Escalate DEFCON 2</span>
        </button>

        <button
          onClick={onMarkFalsePositive}
          className="flex items-center gap-1 px-3 py-1 rounded bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-outline hover:text-on-surface font-mono text-xs uppercase transition-colors"
        >
          <span>False Positive</span>
        </button>

        <button
          onClick={onDeselectAll}
          className="p-1 rounded text-outline hover:text-on-surface ml-1 transition-colors"
          title="Dismiss selection"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
