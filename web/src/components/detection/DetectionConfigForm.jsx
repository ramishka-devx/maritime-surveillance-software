import React from 'react';

export default function DetectionConfigForm({
  model,
  config,
  onConfigChange,
  onSave,
  onReset,
}) {
  const isEnabled = config.enabled;

  return (
    <section className="flex flex-col gap-5 bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 shadow-sm font-sans select-none">
      {/* Center Card Header with Live Toggle */}
      <div className="flex flex-col gap-3 pb-2 border-b border-outline-variant/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400 text-[24px]">model_training</span>
            <h2 className="text-sm sm:text-base font-bold text-on-surface tracking-wide uppercase m-0">
              {model.name} Configuration
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs uppercase font-semibold ${
                isEnabled ? 'text-emerald-400' : 'text-outline'
              }`}
            >
              {isEnabled ? 'Active' : 'Disabled'}
            </span>
            {/* Operational Toggle */}
            <button
              type="button"
              onClick={() => onConfigChange({ ...config, enabled: !isEnabled })}
              aria-label="Toggle model activation"
              className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors cursor-pointer shadow-sm ${
                isEnabled ? 'bg-cyan-400 justify-end' : 'bg-surface-container-highest justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-surface shadow-md" />
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex items-center justify-between p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-bold text-on-surface text-[11px]">
              STATUS: INSPECTING 1,248 ACTIVE TRACKS
            </span>
          </div>
          <span className="text-[11px] text-outline font-semibold">
            {model.engine || 'ISOLATION FOREST v2'}
          </span>
        </div>

        <p className="font-mono text-xs text-on-surface-variant m-0 leading-relaxed">
          {model.fullDescription || 'Detects kinematic deviations and abnormal sprint velocities benchmarked against vessel class peer baselines.'}
        </p>
      </div>

      {/* Form Tuning Controls */}
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        {/* Field 1: Minimum Samples */}
        <div className="p-3.5 rounded bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="peerSamples" className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5 font-mono">
              <span className="text-cyan-400">01.</span> Minimum samples per peer group
            </label>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container-highest text-cyan-300 border border-outline-variant/30 font-semibold">
              N = {config.peerSamples}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="peerSamples"
                type="number"
                min="50"
                max="1000"
                step="10"
                value={config.peerSamples}
                onChange={(e) => onConfigChange({ ...config, peerSamples: Number(e.target.value) })}
                className="w-full bg-surface-container-lowest rounded px-3 py-2 text-on-surface font-mono text-sm border border-outline-variant/40 focus:border-cyan-400 focus:outline-none"
              />
              <span className="absolute right-3 top-2 font-mono text-xs text-outline font-semibold">
                PINGS
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onConfigChange({ ...config, peerSamples: Math.min(1000, config.peerSamples + 10) })}
                className="p-1 rounded bg-surface-container-highest text-on-surface hover:text-cyan-400 hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Increment"
              >
                <span className="material-symbols-outlined text-[16px]">expand_less</span>
              </button>
              <button
                type="button"
                onClick={() => onConfigChange({ ...config, peerSamples: Math.max(50, config.peerSamples - 10) })}
                className="p-1 rounded bg-surface-container-highest text-on-surface hover:text-cyan-400 hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Decrement"
              >
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          <p className="font-mono text-[11px] text-outline m-0 leading-tight">
            Minimum kinematic AIS telemetry pings required within vessel type and deadweight tonnage cluster before baseline calculation. Lower values increase noise.
          </p>
        </div>

        {/* Field 2: Contamination Factor Slider */}
        <div className="p-3.5 rounded bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="contaminationSlider" className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5 font-mono">
              <span className="text-cyan-400">02.</span> Isolation Forest Contamination Factor (ν)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-outline uppercase">Outlier Ratio:</span>
              <span className="font-mono text-xs text-cyan-400 font-bold px-2 py-0.5 rounded bg-surface-container-lowest border border-cyan-400/30">
                {Number(config.contamination).toFixed(2)} ({(Number(config.contamination) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex flex-col gap-1.5 pt-1">
            <input
              id="contaminationSlider"
              type="range"
              min="0.01"
              max="0.20"
              step="0.01"
              value={config.contamination}
              onChange={(e) => onConfigChange({ ...config, contamination: parseFloat(e.target.value) })}
              className="w-full h-2 bg-surface-container-lowest rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            {/* Tick Marks */}
            <div className="flex justify-between font-mono text-[10px] text-outline px-1">
              <span className="flex flex-col items-center">|<span>0.01</span></span>
              <span className={`flex flex-col items-center ${config.contamination === 0.05 ? 'text-cyan-400 font-bold' : ''}`}>
                |<span>0.05 (DEF)</span>
              </span>
              <span className="flex flex-col items-center">|<span>0.10</span></span>
              <span className="flex flex-col items-center">|<span>0.15</span></span>
              <span className="flex flex-col items-center">|<span>0.20</span></span>
            </div>
          </div>

          <p className="font-mono text-[11px] text-outline m-0 leading-tight">
            The proportion of outliers in the kinematic data set. Defines decision threshold boundary for flagging anomalies. Increasing this yields higher alert volume.
          </p>
        </div>

        {/* Field 3: Speed Percentile Cutoff */}
        <div className="p-3.5 rounded bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="percentileSelect" className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5 font-mono">
              <span className="text-cyan-400">03.</span> Speed Percentile Threshold (SOG p-value)
            </label>
            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              STRICT COMPLIANCE
            </span>
          </div>

          <div className="relative">
            <select
              id="percentileSelect"
              value={config.percentile}
              onChange={(e) => onConfigChange({ ...config, percentile: e.target.value })}
              className="w-full bg-surface-container-lowest rounded px-3 py-2 text-on-surface font-mono text-xs border border-outline-variant/40 focus:border-cyan-400 focus:outline-none appearance-none cursor-pointer pr-10"
            >
              <option value="p95">p95 (Top 5.0% kinematic deviation) — Relaxed threshold</option>
              <option value="p99">p99 (Top 1.0% kinematic deviation) — Standard default</option>
              <option value="p99.5">p99.5 (Top 0.5% extreme anomaly) — Strict sprint only</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-outline pointer-events-none text-[18px]">
              unfold_more
            </span>
          </div>

          <p className="font-mono text-[11px] text-outline m-0 leading-tight">
            Percentile cutoff above peer mean Speed Over Ground. Contacts exceeding this threshold trigger instant operator interdiction flags in DEFCON monitoring.
          </p>
        </div>

        {/* Field 4: Velocity Acceleration Delta */}
        <div className="p-3.5 rounded bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5 font-mono">
              <span className="text-cyan-400">04.</span> Acceleration Surge Trigger (Δv/Δt)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-outline">&gt; {config.surgeCeiling || '8.5'} kn/min</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-emerald-400 font-mono text-[10px] font-bold">
                ENABLED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-outline uppercase font-semibold">SURGE CEILING</span>
              <input
                type="text"
                value={config.surgeCeiling}
                onChange={(e) => onConfigChange({ ...config, surgeCeiling: e.target.value })}
                className="bg-surface-container-lowest rounded px-3 py-1.5 text-on-surface font-mono text-xs border border-outline-variant/40 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-outline uppercase font-semibold">CONSECUTIVE SAMPLES</span>
              <input
                type="text"
                value={config.consecutiveSamples}
                onChange={(e) => onConfigChange({ ...config, consecutiveSamples: e.target.value })}
                className="bg-surface-container-lowest rounded px-3 py-1.5 text-on-surface font-mono text-xs border border-outline-variant/40 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <p className="font-mono text-[11px] text-outline m-0 leading-tight">
            Immediate interdiction interrupt if contact sustains rate-of-turn or sprint acceleration exceeding vessel hull capability curves.
          </p>
        </div>

        {/* Bottom Action Deck */}
        <div className="flex flex-col gap-2.5 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 rounded bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_14px_rgba(34,211,238,0.35)] hover:bg-cyan-300 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-2 rounded bg-surface-container-highest border border-outline-variant/40 text-on-surface hover:text-cyan-400 hover:border-cyan-400/40 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-surface-container-lowest border border-outline-variant/30 text-outline font-mono text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-cyan-400 shrink-0">info</span>
            <span>Model recalculation will take effect across edge pods in ~15s after deployment.</span>
          </div>
        </div>
      </form>
    </section>
  );
}
