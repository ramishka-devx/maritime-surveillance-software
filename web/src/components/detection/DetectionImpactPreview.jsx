import React from 'react';

export default function DetectionImpactPreview({ contamination = 0.05 }) {
  // Dynamically calculate simulation values based on contamination slider factor
  const baselineAlerts = 28;
  const multiplier = (contamination / 0.04);
  const projectedAlerts = Math.round(baselineAlerts * multiplier);
  const deltaPercent = (((projectedAlerts - baselineAlerts) / baselineAlerts) * 100).toFixed(1);
  const fpRisk = (contamination * 62).toFixed(1);
  const overheadMin = Math.round(11 * (projectedAlerts / 39));

  return (
    <aside className="flex flex-col gap-4 bg-surface-container-low p-4 sm:p-5 rounded-lg border border-outline-variant/30 shadow-sm font-sans select-none">
      <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">troubleshoot</span>
          <h3 className="text-xs sm:text-sm font-bold text-on-surface tracking-wide uppercase m-0 font-mono">
            Impact Preview
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-cyan-300 font-mono text-[11px] font-bold border border-outline-variant/30">
          SIMULATION
        </span>
      </div>

      <p className="font-mono text-xs text-on-surface-variant m-0 leading-relaxed">
        Live delta projection against Dover Sector 24-hour historical stream (8,410 tracked vessel-hours).
      </p>

      {/* KPI Metrics Comparison Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded bg-surface-container border border-outline-variant/30 flex flex-col font-mono">
          <span className="text-[10px] text-outline uppercase font-semibold">Current Baseline</span>
          <span className="text-base sm:text-lg text-on-surface font-bold mt-0.5">
            {baselineAlerts} <span className="text-xs font-normal text-outline">alerts/day</span>
          </span>
          <span className="text-[10px] text-outline mt-0.5">p99 / ν=0.04</span>
        </div>

        <div className="p-3 rounded bg-surface-container border border-cyan-400/30 flex flex-col font-mono bg-cyan-950/20">
          <span className="text-[10px] text-cyan-400 uppercase font-semibold">Projected Load</span>
          <span className="text-base sm:text-lg text-cyan-400 font-bold mt-0.5">
            {projectedAlerts} <span className="text-xs font-normal text-cyan-300">alerts/day</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
            {deltaPercent >= 0 ? `+${deltaPercent}` : deltaPercent}% DELTA
          </span>
        </div>

        <div className="p-3 rounded bg-surface-container border border-outline-variant/30 flex flex-col font-mono">
          <span className="text-[10px] text-outline uppercase font-semibold">False Positive Risk</span>
          <span className="text-base sm:text-lg text-emerald-400 font-bold mt-0.5">{fpRisk}%</span>
          <span className="text-[10px] text-outline mt-0.5">LOW RISK BAND</span>
        </div>

        <div className="p-3 rounded bg-surface-container border border-outline-variant/30 flex flex-col font-mono">
          <span className="text-[10px] text-outline uppercase font-semibold">Operator Overhead</span>
          <span className="text-base sm:text-lg text-blue-300 font-bold mt-0.5">+{overheadMin} min</span>
          <span className="text-[10px] text-outline mt-0.5">PER 12H WATCH</span>
        </div>
      </div>

      {/* Telemetry SVG Area Chart Comparison (24h Alert Distribution) */}
      <div className="flex flex-col gap-2 p-3.5 rounded bg-surface-container border border-outline-variant/30 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-on-surface uppercase font-bold tracking-wide">
            24H Anomaly Distribution Curve
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-outline">
              <span className="h-2 w-2 rounded-full bg-outline" /> Current
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Projected
            </span>
          </div>
        </div>

        {/* Inline SVG Visualizer */}
        <div className="w-full h-36 relative mt-1">
          <svg className="w-full h-full" fill="none" viewBox="0 0 340 140" xmlns="http://www.w3.org/2000/svg">
            {/* Grid lines */}
            <line className="text-outline-variant/40" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="340" y1="30" y2="30" />
            <line className="text-outline-variant/40" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="340" y1="70" y2="70" />
            <line className="text-outline-variant/40" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="340" y1="110" y2="110" />

            {/* Baseline Area & Line (Current) */}
            <path className="text-outline/15" d="M 10,120 Q 50,110 80,95 T 160,80 T 230,105 T 300,75 L 330,90 L 330,130 L 10,130 Z" fill="currentColor" />
            <path className="text-outline" d="M 10,120 Q 50,110 80,95 T 160,80 T 230,105 T 300,75 L 330,90" fill="none" stroke="currentColor" strokeWidth="1.75" />

            {/* Projected Area & Line (New settings) */}
            <path className="text-cyan-400/20" d="M 10,115 Q 50,90 80,70 T 160,55 T 230,80 T 300,45 L 330,60 L 330,130 L 10,130 Z" fill="currentColor" />
            <path className="text-cyan-400" d="M 10,115 Q 50,90 80,70 T 160,55 T 230,80 T 300,45 L 330,60" fill="none" stroke="currentColor" strokeWidth="2.5" />

            {/* Reticle Marker on Peak */}
            <circle className="fill-cyan-400" cx="300" cy="45" r="4" />
            <circle className="text-cyan-400 animate-ping" cx="300" cy="45" fill="none" r="7" stroke="currentColor" strokeWidth="1" />

            {/* Hour Markers */}
            <text className="text-outline font-mono text-[9px]" fill="currentColor" x="10" y="138">00:00</text>
            <text className="text-outline font-mono text-[9px]" fill="currentColor" x="80" y="138">06:00</text>
            <text className="text-outline font-mono text-[9px]" fill="currentColor" x="160" y="138">12:00</text>
            <text className="text-outline font-mono text-[9px]" fill="currentColor" x="240" y="138">18:00</text>
            <text className="text-outline font-mono text-[9px]" fill="currentColor" x="305" y="138">23:59</text>
          </svg>
        </div>

        <span className="text-[10px] text-outline text-right font-mono">
          PEAK: 20:00 UTC (EVENING TIDE SURGE)
        </span>
      </div>

      {/* Breakdown by Vessel Class List */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
          Targeted Vessel Class Breakdown
        </span>
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          {/* Class 1 */}
          <div className="p-2 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <span className="text-on-surface font-medium text-[11px]">Cargo / Bulk Carrier</span>
            <div className="flex items-center gap-2">
              <span className="text-outline">14</span>
              <span className="text-outline">→</span>
              <span className="text-cyan-400 font-bold">{Math.round(18 * multiplier)} / day</span>
            </div>
          </div>

          {/* Class 2 */}
          <div className="p-2 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <span className="text-on-surface font-medium text-[11px]">Tankers / Crude Carrier</span>
            <div className="flex items-center gap-2">
              <span className="text-outline">8</span>
              <span className="text-outline">→</span>
              <span className="text-cyan-400 font-bold">{Math.round(11 * multiplier)} / day</span>
            </div>
          </div>

          {/* Class 3 */}
          <div className="p-2 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <span className="text-on-surface font-medium text-[11px]">Fishing / Commercial Trawler</span>
            <div className="flex items-center gap-2">
              <span className="text-outline">4</span>
              <span className="text-outline">→</span>
              <span className="text-blue-300 font-bold">{Math.round(7 * multiplier)} / day</span>
            </div>
          </div>

          {/* Class 4 */}
          <div className="p-2 rounded bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <span className="text-on-surface font-medium text-[11px]">High Speed Patrol / Craft</span>
            <div className="flex items-center gap-2">
              <span className="text-outline">2</span>
              <span className="text-outline">→</span>
              <span className="text-cyan-400 font-bold">{Math.round(3 * multiplier)} / day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className="p-3 rounded bg-surface-container-highest border border-outline-variant/40 flex items-start gap-2.5">
        <span className="material-symbols-outlined text-cyan-400 text-[18px] shrink-0 mt-0.5">verified_user</span>
        <p className="font-mono text-xs text-on-surface m-0 leading-relaxed">
          <strong className="text-cyan-400 font-bold">RECOMMENDED:</strong> Contamination factor at 0.05 maintains NATO STANAG interdiction compliance without queue saturation on watch console.
        </p>
      </div>
    </aside>
  );
}
