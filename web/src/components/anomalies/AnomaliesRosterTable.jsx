import React from 'react';

export default function AnomaliesRosterTable({
  anomalies,
  selectedMmsi,
  onSelectAnomaly,
  onRejectAnomaly,
  currentPage = 1,
  totalPages = 4,
  onPageChange,
}) {
  return (
    <div className="flex-1 w-full overflow-hidden bg-surface-container-low border border-outline-variant/30 rounded-lg shadow-sm font-sans select-none">
      {/* Table Subheader */}
      <div className="px-4 py-2 bg-surface-container-lowest flex items-center justify-between border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-cyan-400">
            table_chart
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
            Target Anomaly Roster ({anomalies.length} Tracks Monitored)
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-outline">
          <span>
            Sort: <strong className="text-cyan-400">Score (DESC)</strong>
          </span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest text-outline font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/30">
              <th className="py-2.5 px-3">Vessel &amp; Flag</th>
              <th className="py-2.5 px-3">Peer Group</th>
              <th className="py-2.5 px-3 text-right">Observed SOG</th>
              <th className="py-2.5 px-3 text-right">Peer p99</th>
              <th className="py-2.5 px-3 text-left w-36">Anomaly Score</th>
              <th className="py-2.5 px-3">Detected At</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-mono text-xs text-on-surface">
            {anomalies.map((item) => {
              const isSelected = selectedMmsi === item.mmsi;
              const isCritical = item.score >= 0.85;
              const isHigh = item.score >= 0.75 && item.score < 0.85;

              const scoreColor = isCritical
                ? 'text-red-400'
                : isHigh
                ? 'text-amber-400'
                : 'text-cyan-400';

              const barBgColor = isCritical
                ? 'bg-red-500 shadow-[0_0_6px_#EF4444]'
                : isHigh
                ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]'
                : 'bg-cyan-400 shadow-[0_0_6px_#22D3EE]';

              return (
                <tr
                  key={item.mmsi}
                  onClick={() => onSelectAnomaly(item)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-surface-container-high/90 border-l-4 border-cyan-400 shadow-[inset_0_0_12px_rgba(34,211,238,0.12)]'
                      : 'hover:bg-surface-container/70'
                  }`}
                >
                  {/* Vessel & MMSI */}
                  <td className="py-2.5 px-3 font-semibold">
                    <div className="flex items-center gap-1.5">
                      
                      <span className="truncate max-w-[140px] text-on-surface font-bold">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-outline font-normal">
                      {item.mmsi}
                    </div>
                  </td>

                  {/* Peer Group */}
                  <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                    {item.peerGroup}
                  </td>

                  {/* Observed SOG */}
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span className={scoreColor}>{item.sog}</span>
                    <span className={`text-[10px] block leading-none font-normal ${scoreColor}`}>
                      {item.diff}
                    </span>
                  </td>

                  {/* Peer p99 */}
                  <td className="py-2.5 px-3 text-right text-outline">{item.peerP99}</td>

                  {/* Anomaly Score Bar */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${scoreColor}`}>
                        {item.score.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Detected At */}
                  <td className="py-2.5 px-3">
                    <div className="text-on-surface">{item.time}</div>
                    <div className="text-[10px] text-outline">{item.elapsed}</div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3">
                    {item.status === 'NEW' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-400 border border-cyan-400/40 text-[10px] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        NEW
                      </span>
                    )}
                    {item.status === 'CONFIRMED' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/40 text-[10px] font-bold">
                        CONFIRMED
                      </span>
                    )}
                    {item.status === 'FALSE_POS' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-highest text-outline border border-outline-variant/40 text-[10px]">
                        FALSE POSITIVE
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectAnomaly(item)}
                        className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-highest text-slate-200 hover:text-white border border-outline-variant/30 text-xs font-medium transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onRejectAnomaly(item)}
                        className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 hover:bg-red-950/70 border border-red-500/30 text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onConfirmAlert(item)}
                        className="w-full py-0.5 px-2 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold uppercase transition-all shadow-[0_0_12px_rgba(34,211,238,0.35)] flex items-center justify-center gap-1.5"
                      >
                        <span>Confirm</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {anomalies.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-outline font-mono text-xs">
                  No target anomalies detected in selected time window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Table Pagination Strip */}
      <div className="px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs text-outline">
        <div>
          {anomalies.length === 0
            ? 'Showing 0 anomaly detections'
            : `Showing rows 1–${anomalies.length} of ${anomalies.length} anomaly detections`}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              onClick={() => onPageChange && onPageChange(page)}
              className={`px-2 py-0.5 rounded transition-colors ${
                currentPage === page
                  ? 'bg-surface-container-high text-cyan-400 font-bold border border-cyan-400/30'
                  : 'hover:bg-surface-container text-outline'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
