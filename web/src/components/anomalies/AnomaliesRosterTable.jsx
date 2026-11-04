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
    <div className="flex-1 w-full overflow-hidden bg-white border border-slate-200 rounded-sm shadow-xs font-sans select-none">
      {/* Table Subheader */}
      <div className="px-4 py-2 bg-slate-50 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#0891b2]">
            table_chart
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Target Anomaly Roster ({anomalies.length} Tracks Monitored)
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
          <span>
            Sort: <strong className="text-[#0891b2]">Score (DESC)</strong>
          </span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
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
          <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-900">
            {anomalies.map((item) => {
              const isSelected = selectedMmsi === item.mmsi;
              const isCritical = item.score >= 0.85;
              const isHigh = item.score >= 0.75 && item.score < 0.85;

              const scoreColor = isCritical
                ? 'text-red-600'
                : isHigh
                ? 'text-amber-600'
                : 'text-[#0891b2]';

              return (
                <tr
                  key={item.mmsi}
                  onClick={() => onSelectAnomaly(item)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-50/70 border-l-4 border-[#0891b2]'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Vessel & MMSI */}
                  <td className="py-2.5 px-3 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[140px] text-slate-900 font-bold">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {item.mmsi}
                    </div>
                  </td>

                  {/* Peer Group */}
                  <td className="py-2.5 px-3 text-slate-700 font-sans text-xs">
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
                  <td className="py-2.5 px-3 text-right text-slate-500">{item.peerP99}</td>

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
                    <div className="text-slate-900 font-semibold">{item.time}</div>
                    <div className="text-[10px] text-slate-500">{item.elapsed}</div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3">
                    {item.status === 'NEW' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0891b2] animate-pulse" />
                        NEW
                      </span>
                    )}
                    {item.status === 'CONFIRMED' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                        CONFIRMED
                      </span>
                    )}
                    {item.status === 'FALSE_POS' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                        FALSE POSITIVE
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectAnomaly(item)}
                        className="px-2 py-0.5 rounded-sm bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium transition-colors shadow-xs cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onRejectAnomaly(item)}
                        className="px-2 py-0.5 rounded-sm bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onConfirmAlert(item)}
                        className="py-0.5 px-2 rounded-sm bg-[#0891b2] hover:bg-[#0e7490] text-white font-mono text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                <td colSpan={9} className="py-12 text-center text-slate-500 font-mono text-xs">
                  No target anomalies detected in selected time window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Table Pagination Strip */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-mono text-xs text-slate-600">
        <div>
          {anomalies.length === 0
            ? 'Showing 0 anomaly detections'
            : `Showing rows 1–${anomalies.length} of ${anomalies.length} anomaly detections`}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              onClick={() => onPageChange && onPageChange(page)}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                currentPage === page
                  ? 'bg-[#0891b2] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
