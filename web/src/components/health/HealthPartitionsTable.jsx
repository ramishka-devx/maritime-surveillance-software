import React from 'react';

export default function HealthPartitionsTable({
  partitions,
  onCreatePartition,
  onRunMaintenance,
  onInspectPartition,
}) {
  const missingCount = partitions.filter((p) => p.status === 'Missing').length;

  return (
    <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md border border-outline-variant/30 font-sans select-none">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">table_chart</span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface tracking-wide uppercase m-0 font-mono">
                Database Partitions — ais_positions
              </h3>
            </div>
            <p className="font-mono text-xs text-outline mt-0.5 m-0">
              Partition maintenance cron: cron.partition_watch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">
              Cron: 14:00 UTC (32m ago)
            </span>
            {missingCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300 font-bold">
                {missingCount} Missing
              </span>
            )}
          </div>
        </div>

        {/* Partition Table Container */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-surface-container text-outline text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l">Partition Name</th>
                <th className="py-2.5 px-3">Date Range (UTC)</th>
                <th className="py-2.5 px-3 text-right">Row Count</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 rounded-r text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-[11px]">
              {partitions.map((part) => {
                const isToday = part.isToday;
                const isMissing = part.status === 'Missing';

                return (
                  <tr
                    key={part.id}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-surface-container-high/40 hover:bg-surface-container-high/70'
                        : 'hover:bg-surface-container-high/60'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <span className={isToday ? 'text-cyan-400' : isMissing ? 'text-red-400' : ''}>
                          {part.name}
                        </span>
                        {isToday && (
                          <span className="text-[9px] px-1 py-0.2 bg-cyan-400/20 text-cyan-300 rounded font-bold">
                            TODAY
                          </span>
                        )}
                        {part.tag && (
                          <span className="text-outline text-[10px]">{part.tag}</span>
                        )}
                        {isMissing && (
                          <span className="text-[9px] px-1 py-0.2 bg-red-950/80 text-red-300 rounded font-bold border border-red-500/30">
                            MISSING
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-on-surface-variant">
                      {part.range}
                    </td>

                    <td className={`py-2.5 px-3 text-right ${isToday ? 'text-cyan-400 font-bold' : isMissing ? 'text-outline' : 'text-on-surface'}`}>
                      {part.rowCount}
                    </td>

                    <td className="py-2.5 px-3 text-right text-outline">
                      {part.size}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {part.status === 'Created' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-emerald-300 font-bold text-[10px]">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span> Created
                        </span>
                      )}
                      {part.status === 'Active' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-emerald-300 font-bold text-[10px]">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span> Active
                        </span>
                      )}
                      {part.status === 'Ready' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-emerald-300 font-bold text-[10px]">
                          <span className="material-symbols-outlined text-[13px]">check</span> Ready
                        </span>
                      )}
                      {part.status === 'Missing' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300 font-bold text-[10px]">
                          <span className="material-symbols-outlined text-[13px]">warning</span> Missing
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {isMissing ? (
                        <button
                          type="button"
                          onClick={() => onCreatePartition(part.id)}
                          className="px-2.5 py-0.5 rounded bg-red-500 hover:bg-red-400 text-black font-bold uppercase transition-all shadow-sm cursor-pointer text-[10px]"
                        >
                          Create Now
                        </button>
                      ) : part.status === 'Ready' ? (
                        <button
                          type="button"
                          onClick={() => onInspectPartition(part.id)}
                          className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface-variant uppercase font-semibold transition-colors cursor-pointer text-[10px]"
                        >
                          Pre-alloc
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onInspectPartition(part.id)}
                          className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-highest text-cyan-400 uppercase font-semibold transition-colors cursor-pointer text-[10px]"
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partition Table Footer Controls */}
      <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest/60 p-3 rounded-lg border border-outline-variant/20 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-outline">
          <span className="material-symbols-outlined text-[16px] text-cyan-400">schedule</span>
          <span>Next partition watch cron: <strong className="text-on-surface">18:00 UTC</strong> (every 6h)</span>
        </div>
        <button
          type="button"
          onClick={onRunMaintenance}
          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-cyan-400 border border-cyan-400/30 font-bold uppercase transition-colors cursor-pointer text-xs"
        >
          Run Partition Maintenance Now
        </button>
      </div>
    </div>
  );
}
