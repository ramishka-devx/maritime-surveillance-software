import React from 'react';

export default function DetectionHeaderBar({ activeModelsCount = 6, edgeCluster = 'DOVER-NODE-04', latencyMs = '4.2' }) {
  return (
    <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 select-none font-sans">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-highest text-cyan-400 font-mono text-xs border border-outline-variant/40">
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>ENGINE ML-CORE v3.8.4 // REAL-TIME INFERENCE</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE // AUTONOMOUS PIPELINE ACTIVE</span>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mt-0.5">
          <h1 className="text-xl font-bold uppercase tracking-tight text-on-surface m-0">
            Detection Settings
          </h1>
          <span className="hidden sm:inline-block font-mono text-xs text-outline">
            CONFIG-VER: 2026.04-R2
          </span>
        </div>

        <p className="font-mono text-xs text-on-surface-variant max-w-4xl m-0 leading-relaxed">
          Calibrate machine learning thresholds, spatial-temporal anomaly triggers, and heuristic sensitivity parameters across surveillance radar and AIS streams.
        </p>
      </div>

      {/* Quick Telemetry Stats Header Strip */}
      <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30 self-start xl:self-auto shrink-0 font-mono">
        <div className="flex flex-col px-2">
          <span className="text-[10px] text-outline uppercase font-semibold">Active Models</span>
          <span className="text-sm sm:text-base text-cyan-400 font-bold">{activeModelsCount} / 6 ONLINE</span>
        </div>
        <div className="w-px h-8 bg-surface-container-highest" />
        <div className="flex flex-col px-2">
          <span className="text-[10px] text-outline uppercase font-semibold">Edge Cluster</span>
          <span className="text-xs sm:text-sm text-emerald-400 font-bold">{edgeCluster}</span>
        </div>
        <div className="w-px h-8 bg-surface-container-highest" />
        <div className="flex flex-col px-2">
          <span className="text-[10px] text-outline uppercase font-semibold">Inference Latency</span>
          <span className="text-sm sm:text-base text-on-surface font-bold">{latencyMs} ms</span>
        </div>
      </div>
    </header>
  );
}
