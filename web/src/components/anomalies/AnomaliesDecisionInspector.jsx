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
    <div className="w-full xl:w-[390px] shrink-0 bg-white border border-slate-200 rounded-sm shadow-md overflow-hidden flex flex-col font-sans select-none">
      {/* Drawer Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0891b2] text-[18px]">
            psychology
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-900 leading-tight">
              Decision Inspector
            </h2>
            <div className="font-mono text-xs text-[#0891b2] font-semibold tracking-wider">
              {vessel.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-bold border ${
              isCritical
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {numericScore.toFixed(2)} {isCritical ? 'CRITICAL' : 'ELEVATED'}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close Inspector"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="p-3.5 space-y-3.5 max-h-[820px] overflow-y-auto">
        {/* Target Identification Pill */}
        <div className="p-2.5 bg-slate-50 rounded-sm border border-slate-200 flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-slate-500">MMSI: </span>
            <span className="text-slate-900 font-bold">{vessel.mmsi}</span>
          </div>
          <div>
            <span className="text-slate-500">FLAG: </span>
            <span className="text-slate-900 font-bold">{vessel.country || vessel.flag}</span>
          </div>
          <div>
            <span className="text-slate-500">CALL: </span>
            <span className="text-[#0891b2] font-bold">{vessel.callSign || 'ELW9'}</span>
          </div>
        </div>

        {/* Section 2: Observed vs Peer Baseline Comparison */}
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            Kinematic Baselines
          </span>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 rounded-sm bg-slate-50 border border-red-200">
              <span className="text-[10px] uppercase text-slate-500 block leading-none">
                Observed SOG
              </span>
              <span className="text-base font-bold text-red-600 mt-1 block">
                {vessel.sog}{' '}
                <span className="text-[10px] font-normal text-slate-500">kn</span>
              </span>
              <span className="text-[10px] text-red-600 font-semibold">{vessel.diff} vs peer</span>
            </div>

            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block leading-none">
                Peer p99 SOG
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {vessel.peerP99}{' '}
                <span className="text-[10px] font-normal text-slate-500">kn</span>
              </span>
              <span className="text-[10px] text-slate-500">{vessel.peerGroup}</span>
            </div>

            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block leading-none">
                Fleet Median
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                13.6 <span className="text-[10px] font-normal text-slate-500">kn</span>
              </span>
              <span className="text-[10px] text-slate-500">Gaussian center</span>
            </div>

            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 block leading-none">
                Zone Advisory
              </span>
              <span className="text-base font-bold text-amber-700 mt-1 block">
                15.0 <span className="text-[10px] font-normal text-slate-500">kn</span>
              </span>
              <span className="text-[10px] text-slate-500">Dover TSS Lane</span>
            </div>
          </div>
        </div>

        {/* Section 3: Operator Decision & Feedback Loop */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => onConfirmAlert(vessel, rationale)}
              className="w-full py-2 px-3 rounded-sm bg-[#0891b2] hover:bg-[#0e7490] text-white font-mono text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Confirm Anomaly &amp; Dispatch Alert</span>
            </button>

            <button
              onClick={() => onMarkFalsePositive(vessel, rationale)}
              className="w-full py-1.5 px-3 rounded-sm bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 font-mono text-xs font-semibold uppercase transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Mark as False Positive</span>
            </button>
          </div>

          {/* Retrain Microcopy */}
          <p className="font-mono text-[10px] text-slate-500 text-center leading-tight pt-1">
            Operator classifications automatically retrain nightly Isolation Forest model weights.
          </p>
        </div>
      </div>
    </div>
  );
}
