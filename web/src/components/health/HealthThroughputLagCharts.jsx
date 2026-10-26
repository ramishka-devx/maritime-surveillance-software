import React from 'react';

export default function HealthThroughputLagCharts() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans select-none">
      {/* Chart 1: Telemetry Ingest Area Chart */}
      <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md border border-outline-variant/30">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <h3 className="text-xs sm:text-sm font-bold text-on-surface tracking-wider uppercase m-0 font-mono">
                  Ingest Throughput (Last 60 Min)
                </h3>
              </div>
              <p className="font-mono text-xs text-outline mt-0.5 m-0">
                Aggregated telemetry packet flow across Dover &amp; Channel feeds
              </p>
            </div>
            <div className="flex items-baseline gap-1 bg-surface-container-lowest border border-outline-variant/30 px-3 py-1 rounded-lg font-mono self-start sm:self-auto">
              <span className="text-lg sm:text-xl font-bold text-cyan-400">1,840</span>
              <span className="text-xs text-outline font-semibold">msg/s</span>
            </div>
          </div>

          {/* Summary Badges */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-center font-mono">
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-2 rounded">
              <span className="text-[10px] text-outline block font-semibold uppercase">Floor Min</span>
              <span className="text-xs text-on-surface font-semibold">1,620 msg/s</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-2 rounded">
              <span className="text-[10px] text-outline block font-semibold uppercase">Window Avg</span>
              <span className="text-xs text-cyan-400 font-semibold">1,815 msg/s</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-2 rounded">
              <span className="text-[10px] text-outline block font-semibold uppercase">Peak Surge</span>
              <span className="text-xs text-emerald-400 font-semibold">2,140 @ 14:15</span>
            </div>
          </div>
        </div>

        {/* SVG Line/Area Graph */}
        <div className="w-full relative h-48 bg-surface-container-lowest rounded-lg p-2 flex flex-col justify-between overflow-hidden border border-outline-variant/20">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 160">
            <defs>
              <linearGradient id="cyanGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid lines */}
            <line stroke="#232a39" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="600" y1="30" y2="30" />
            <line stroke="#232a39" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="600" y1="70" y2="70" />
            <line stroke="#232a39" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="600" y1="110" y2="110" />
            <line stroke="#232a39" strokeWidth="1" x1="0" x2="600" y1="150" y2="150" />

            {/* Fill Path */}
            <path
              d="M 0 100 Q 50 115 100 95 T 200 80 T 300 110 T 400 40 T 450 30 T 500 85 T 600 70 L 600 160 L 0 160 Z"
              fill="url(#cyanGradient)"
            />

            {/* Stroke Path */}
            <path
              d="M 0 100 Q 50 115 100 95 T 200 80 T 300 110 T 400 40 T 450 30 T 500 85 T 600 70"
              fill="none"
              stroke="#22d3ee"
              strokeLinecap="round"
              strokeWidth="2.5"
            />

            {/* Peak Callout Point */}
            <circle cx="450" cy="30" fill="#68f5b8" r="4" />
            <circle cx="450" cy="30" fill="none" opacity="0.6" r="8" stroke="#68f5b8" strokeWidth="1" />

            {/* Live Tail Point */}
            <circle cx="600" cy="70" fill="#22d3ee" r="3.5" />
          </svg>

          {/* Timeline Labels */}
          <div className="flex justify-between items-center text-outline font-mono text-[10px] px-1 pt-1">
            <span>13:30 UTC</span>
            <span>13:45 UTC</span>
            <span>14:00 UTC</span>
            <span>14:15 UTC (Peak)</span>
            <span className="text-cyan-400 font-bold">14:30 UTC [NOW]</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Kafka Consumer Lag Area Chart */}
      <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md border border-outline-variant/30">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                <h3 className="text-xs sm:text-sm font-bold text-on-surface tracking-wider uppercase m-0 font-mono">
                  Kafka Consumer Lag (Last 60 Min)
                </h3>
              </div>
              <p className="font-mono text-xs text-outline mt-0.5 m-0">
                Buffer queue differential on topic 'ais.raw.telemetry'
              </p>
            </div>
            <div className="flex items-baseline gap-1 bg-surface-container-lowest border border-outline-variant/30 px-3 py-1 rounded-lg font-mono self-start sm:self-auto">
              <span className="text-lg sm:text-xl font-bold text-blue-300">120</span>
              <span className="text-xs text-outline font-semibold">messages</span>
            </div>
          </div>

          {/* Alert threshold indicator bar */}
          <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/20 px-3 py-2 rounded-lg mb-3 font-mono">
            <span className="text-[10px] text-outline uppercase font-semibold">
              CRITICAL LAG CEILING: 150 MSG
            </span>
            <span className="text-xs text-blue-300 font-bold">
              CURRENT: 80% OF THRESHOLD
            </span>
          </div>
        </div>

        {/* SVG Line Graph with Warning Zone */}
        <div className="w-full relative h-48 bg-surface-container-lowest rounded-lg p-2 flex flex-col justify-between overflow-hidden border border-outline-variant/20">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 160">
            <defs>
              <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#adc6ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#adc6ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Threshold Zone Line */}
            <line opacity="0.8" stroke="#ef4444" strokeDasharray="6,4" strokeWidth="1.5" x1="0" x2="600" y1="35" y2="35" />
            <text fill="#ef4444" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold" textAnchor="end" x="590" y="28">
              WARN THRESHOLD (150)
            </text>

            {/* Internal Guide lines */}
            <line stroke="#232a39" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="600" y1="75" y2="75" />
            <line stroke="#232a39" strokeDasharray="4,4" strokeWidth="1" x1="0" x2="600" y1="115" y2="115" />
            <line stroke="#232a39" strokeWidth="1" x1="0" x2="600" y1="150" y2="150" />

            {/* Area Fill */}
            <path
              d="M 0 135 L 120 138 L 240 134 L 360 130 L 450 120 L 510 50 L 540 45 L 600 52 L 600 160 L 0 160 Z"
              fill="url(#blueGradient)"
            />

            {/* Line Path */}
            <path
              d="M 0 135 L 120 138 L 240 134 L 360 130 L 450 120 L 510 50 L 540 45 L 600 52"
              fill="none"
              stroke="#adc6ff"
              strokeLinecap="round"
              strokeWidth="2.5"
            />

            {/* Spike Marker */}
            <circle cx="510" cy="50" fill="#adc6ff" r="4" />
            <circle cx="510" cy="50" fill="none" opacity="0.6" r="8" stroke="#adc6ff" strokeWidth="1" />
          </svg>

          {/* Event Annotation */}
          <div className="absolute left-1/2 bottom-8 transform -translate-x-12 bg-surface-container-high/90 backdrop-blur px-2.5 py-0.5 rounded border border-outline-variant/40 shadow font-mono">
            <span className="text-[10px] text-blue-200 font-medium">
              Spike: Batch Feature Extraction (14:22 UTC)
            </span>
          </div>

          {/* Timeline Labels */}
          <div className="flex justify-between items-center text-outline font-mono text-[10px] px-1 pt-1">
            <span>13:30 (22 msg)</span>
            <span>13:45 (18 msg)</span>
            <span>14:00 (24 msg)</span>
            <span>14:15 (40 msg)</span>
            <span className="text-blue-300 font-bold">14:30 (120 msg)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
