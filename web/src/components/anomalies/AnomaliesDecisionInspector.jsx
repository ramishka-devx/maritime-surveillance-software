import React, { useState } from 'react';

export default function AnomaliesDecisionInspector({
  vessel,
  onClose,
  onConfirmAlert,
  onMarkFalsePositive,
}) {
  const [rationale, setRationale] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  if (!vessel) return null;

  const quickTags = [
    'Tidal Current',
    'Emergency Maneuver',
    'Sensor Multipath',
    'Authorized Trial',
  ];

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    setRationale((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  const numericScore =
    typeof vessel.score === 'number'
      ? vessel.score
      : !isNaN(parseFloat(vessel.score))
      ? parseFloat(vessel.score)
      : 0.75;
  const isCritical = numericScore >= 0.85;

  return (
    <div className="w-full xl:w-[390px] shrink-0 bg-surface-container-low border border-cyan-400/40 rounded-lg shadow-[0_0_20px_rgba(7,14,28,0.8)] overflow-hidden flex flex-col font-sans select-none">
      {/* Drawer Header */}
      <div className="p-3.5 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[18px]">
            psychology
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase text-on-surface leading-tight">
              Decision Inspector
            </h2>
            <div className="font-mono text-xs text-cyan-400 tracking-wider">
              {vessel.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
              isCritical
                ? 'bg-red-950/80 text-red-400 border-red-500/50'
                : 'bg-amber-950/80 text-amber-400 border-amber-500/50'
            }`}
          >
            {numericScore.toFixed(2)} {isCritical ? 'CRITICAL' : 'ELEVATED'}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-container text-outline hover:text-white transition-colors"
            title="Close Inspector"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="p-3.5 space-y-3.5 max-h-[820px] overflow-y-auto">
        {/* Target Identification Pill */}
        <div className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant/30 flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-outline">MMSI: </span>
            <span className="text-white font-semibold">{vessel.mmsi}</span>
          </div>
          <div>
            <span className="text-outline">FLAG: </span>
            <span className="text-white font-semibold">{vessel.country || vessel.flag}</span>
          </div>
          <div>
            <span className="text-outline">CALL: </span>
            <span className="text-cyan-400 font-semibold">{vessel.callSign || 'ELW9'}</span>
          </div>
        </div>

        {/* Section 2: Observed vs Peer Baseline Comparison */}
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] uppercase font-bold text-outline tracking-wider">
            Kinematic Baselines
          </span>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 rounded bg-surface-container-lowest border border-red-500/40">
              <span className="text-[10px] uppercase text-outline block leading-none">
                Observed SOG
              </span>
              <span className="text-base font-bold text-red-400 mt-1 block">
                {vessel.sog}{' '}
                <span className="text-[10px] font-normal text-outline">kn</span>
              </span>
              <span className="text-[10px] text-red-400 font-semibold">{vessel.diff} vs peer</span>
            </div>

            <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[10px] uppercase text-outline block leading-none">
                Peer p99 SOG
              </span>
              <span className="text-base font-bold text-on-surface mt-1 block">
                {vessel.peerP99}{' '}
                <span className="text-[10px] font-normal text-outline">kn</span>
              </span>
              <span className="text-[10px] text-outline">{vessel.peerGroup}</span>
            </div>

            <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[10px] uppercase text-outline block leading-none">
                Fleet Median
              </span>
              <span className="text-base font-bold text-on-surface mt-1 block">
                13.6 <span className="text-[10px] font-normal text-outline">kn</span>
              </span>
              <span className="text-[10px] text-outline">Gaussian center</span>
            </div>

            <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[10px] uppercase text-outline block leading-none">
                Zone Advisory
              </span>
              <span className="text-base font-bold text-amber-400 mt-1 block">
                15.0 <span className="text-[10px] font-normal text-outline">kn</span>
              </span>
              <span className="text-[10px] text-outline">Dover TSS Lane</span>
            </div>
          </div>
        </div>

        {/* Section 3: Operator Decision & Feedback Loop */}
        <div className="space-y-2.5 pt-2 border-t border-outline-variant/30">

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => onConfirmAlert(vessel, rationale)}
              className="w-full py-2 px-3 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold uppercase transition-all shadow-[0_0_12px_rgba(34,211,238,0.35)] flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Confirm Anomaly &amp; Dispatch Alert</span>
            </button>

            <button
              onClick={() => onMarkFalsePositive(vessel, rationale)}
              className="w-full py-1.5 px-3 rounded bg-surface-container hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/40 font-mono text-xs font-semibold uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Mark as False Positive</span>
            </button>
          </div>

          {/* Retrain Microcopy */}
          <p className="font-mono text-[10px] text-outline text-center leading-tight pt-1">
            Operator classifications automatically retrain nightly Isolation Forest model weights.
          </p>
        </div>
      </div>
    </div>
  );
}
