import React from 'react';

export default function UsersMetricsRow({ totalCount, activeCount, deactivatedCount, pendingCount }) {
  const activeRate = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-container-low border-b border-outline-variant/30 select-none font-sans">
      {/* Metric 1 */}
      <div className="flex items-center justify-between p-3 rounded bg-surface-container border border-outline-variant/20 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
            Total Personnel
          </span>
          <span className="font-mono text-lg font-bold text-on-surface">
            {totalCount}
          </span>
        </div>
        <span className="material-symbols-outlined text-outline/50 text-[24px]">group</span>
      </div>

      {/* Metric 2 */}
      <div className="flex items-center justify-between p-3 rounded bg-surface-container border border-outline-variant/20 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active Watch
          </span>
          <span className="font-mono text-lg font-bold text-emerald-400">
            {activeCount}
          </span>
        </div>
        <span className="font-mono text-xs text-emerald-400/80">{activeRate}%</span>
      </div>

      {/* Metric 3 */}
      <div className="flex items-center justify-between p-3 rounded bg-surface-container border border-outline-variant/20 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Deactivated
          </span>
          <span className="font-mono text-lg font-bold text-red-400">
            {deactivatedCount}
          </span>
        </div>
        <span className="font-mono text-xs text-red-400/80">Revoked</span>
      </div>

      {/* Metric 4 */}
      <div className="flex items-center justify-between p-3 rounded bg-surface-container border border-outline-variant/20 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[11px] font-mono text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Pending Invite
          </span>
          <span className="font-mono text-lg font-bold text-purple-300">
            {pendingCount}
          </span>
        </div>
        <span className="font-mono text-xs text-purple-300/80">Awaiting Auth</span>
      </div>
    </div>
  );
}
