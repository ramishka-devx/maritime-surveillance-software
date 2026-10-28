import React from 'react';

export default function UsersMetricsRow({ totalCount, activeCount, deactivatedCount, pendingCount }) {
  const activeRate = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-200 select-none font-sans">
      {/* Metric 1 */}
      <div className="flex items-center justify-between p-3 rounded-sm bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Total Personnel
          </span>
          <span className="font-mono text-lg font-bold text-slate-900">
            {totalCount}
          </span>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-[24px]">group</span>
      </div>

      {/* Metric 2 */}
      <div className="flex items-center justify-between p-3 rounded-sm bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Watch
          </span>
          <span className="font-mono text-lg font-bold text-emerald-700">
            {activeCount}
          </span>
        </div>
        <span className="font-mono text-xs text-emerald-600 font-semibold">{activeRate}%</span>
      </div>

      {/* Metric 3 */}
      <div className="flex items-center justify-between p-3 rounded-sm bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Deactivated
          </span>
          <span className="font-mono text-lg font-bold text-rose-700">
            {deactivatedCount}
          </span>
        </div>
        <span className="font-mono text-xs text-rose-600 font-semibold">Revoked</span>
      </div>

      {/* Metric 4 */}
      <div className="flex items-center justify-between p-3 rounded-sm bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Pending Invite
          </span>
          <span className="font-mono text-lg font-bold text-purple-700">
            {pendingCount}
          </span>
        </div>
        <span className="font-mono text-xs text-purple-600 font-semibold">Awaiting Auth</span>
      </div>
    </div>
  );
}
