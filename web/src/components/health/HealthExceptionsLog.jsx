import React, { useState } from 'react';

const INITIAL_EXCEPTIONS = [
  {
    id: 'exc-1',
    category: 'Meta API',
    type: 'HTTP 504',
    badgeType: 'error',
    timestamp: '14:29:41 UTC',
    service: 'Meta API',
    message: 'Upstream timeout: Weather radar raster endpoint buoy-feed-04 failed to acknowledge within 5000ms.',
  },
  {
    id: 'exc-2',
    category: 'Kafka',
    type: 'LAG_SPIKE',
    badgeType: 'warning',
    timestamp: '14:22:15 UTC',
    service: 'Kafka Consumer',
    message: "Partition 07 consumer group 'anomaly_stream_v2' fell behind by >100 records during peak burst.",
  },
  {
    id: 'exc-3',
    category: 'Ingest',
    type: 'DECODE_ERR',
    badgeType: 'warning',
    timestamp: '14:18:04 UTC',
    service: 'Ingest Service',
    message: 'Corrupted NMEA sentence received from receiver station DOVER-CLIFFS-02: checksum mismatch.',
  },
  {
    id: 'exc-4',
    category: 'Meta API',
    type: 'RATE_LIMIT',
    badgeType: 'info',
    timestamp: '13:58:12 UTC',
    service: 'Meta API',
    message: "External Lloyd's Register registry lookup throttled at 45 req/min. Backoff applied (2.4s).",
  },
];

export default function HealthExceptionsLog() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExceptions = INITIAL_EXCEPTIONS.filter((exc) => {
    if (selectedCategory === 'All') return true;
    return exc.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md border border-outline-variant/30 font-sans select-none">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400 text-[18px]">emergency_home</span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface tracking-wide uppercase m-0 font-mono">
                Recent Service Exceptions
              </h3>
            </div>
            <p className="font-mono text-xs text-outline mt-0.5 m-0">
              Live filtered diagnostic stack trace logs
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/30 px-2 py-1 rounded font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-bold uppercase">LIVE TAIL</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 my-3 font-mono text-xs">
          {[
            { id: 'All', label: 'All (8)' },
            { id: 'Ingest', label: 'Ingest (1)' },
            { id: 'Kafka', label: 'Kafka (3)' },
            { id: 'Postgres', label: 'Postgres (0)' },
            { id: 'Meta API', label: 'Meta API (4)' },
          ].map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-400 text-black font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Structured Log Entries List */}
        <div className="flex flex-col gap-2 font-mono text-xs">
          {filteredExceptions.map((log) => (
            <div
              key={log.id}
              className="bg-surface-container-lowest border border-outline-variant/30 p-3 rounded-lg flex flex-col gap-1 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center justify-between text-outline text-[11px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                      log.badgeType === 'error'
                        ? 'bg-red-950/80 border border-red-500/40 text-red-300'
                        : log.badgeType === 'warning'
                        ? 'bg-blue-950/80 border border-blue-400/40 text-blue-300'
                        : 'bg-surface-container-high text-outline'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className="text-on-surface font-semibold">{log.service}</span>
                </div>
                <span>{log.timestamp}</span>
              </div>
              <p className="font-mono text-xs text-on-surface-variant m-0 leading-relaxed pt-0.5">
                {log.message}
              </p>
            </div>
          ))}

          {filteredExceptions.length === 0 && (
            <div className="p-6 text-center text-outline font-mono text-xs">
              No active exception logs recorded for {selectedCategory}.
            </div>
          )}
        </div>
      </div>

      {/* Log Card Footer */}
      <div className="mt-4 pt-3 flex items-center justify-between text-outline font-mono text-xs border-t border-outline-variant/20">
        <span className="text-[11px]">Audit trail persisted to WORM vault (4 of 28 in 24h)</span>
        <button
          type="button"
          onClick={() => window.open('#', '_blank')}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold text-[11px] transition-colors cursor-pointer"
        >
          <span>Full CloudWatch Logs</span>
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </button>
      </div>
    </div>
  );
}
