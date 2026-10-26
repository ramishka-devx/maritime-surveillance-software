import React from 'react';
import { useNavigate } from 'react-router-dom';

const SEV_BADGE = {
  critical: 'bg-red-950/80 text-red-400 border border-red-500/30',
  high:     'bg-surface-container-highest text-purple-300 border border-purple-500/30',
  medium:   'bg-surface-container-highest text-cyan-300 border border-cyan-500/30',
  low:      'bg-surface-container-highest text-emerald-300 border border-emerald-500/30',
};

const TYPE_LABELS = {
  geofence:       'ZONE INCURSION',
  speed:          'SPEED / COURSE',
  collision_risk: 'COLLISION RISK',
  dark_vessel:    'AIS LOST',
  manual:         'MANUAL REPORT',
};

export default function DashboardLiveInterdictionQueue({ interdictionQueue = [], openAlertsTotal = 0, timeRange = '24h', isLoading = false, onAction }) {
  const navigate = useNavigate();

  const handleAction = (item) => {
    if (onAction) {
      onAction(item);
    } else {
      navigate('/Alerts');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none animate-pulse">
        <div className="h-6 w-56 bg-surface-container-highest rounded mb-4" />
        <div className="h-40 bg-surface-container-highest rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 bg-surface-container-lowest/50 -mx-4 -mt-4 p-4 rounded-t-lg border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-[20px]">crisis_alert</span>
          <span className="text-sm font-bold text-on-surface uppercase">
            Live Interdiction Queue
          </span>
        </div>
        {interdictionQueue.length > 0 && (
          <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 font-mono text-xs font-bold border border-red-500/40 animate-pulse">
            {interdictionQueue.length} ACTIONABLE ({timeRange.toUpperCase()})
          </span>
        )}
      </div>

      {/* Table or empty state */}
      {interdictionQueue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-outline font-mono text-xs gap-2">
          <span className="material-symbols-outlined text-2xl text-emerald-400">verified_user</span>
          <span>No open alerts requiring action</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-surface-container text-outline text-[11px] uppercase">
              <tr>
                <th className="py-2 px-2">UTC</th>
                <th className="py-2 px-2">Vessel / MMSI</th>
                <th className="py-2 px-2">Incident</th>
                <th className="py-2 px-2">Title</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {interdictionQueue.map((item, idx) => {
                const sevClass = SEV_BADGE[item.severity?.toLowerCase()] ?? SEV_BADGE.low;
                const isCritical = item.severity?.toLowerCase() === 'critical';
                const utcLabel = item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                  : '—';
                const incidentLabel = TYPE_LABELS[item.type] ?? (item.type?.toUpperCase() || 'ALERT');

                return (
                  <tr
                    key={item.alertId ?? idx}
                    className={`${idx % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container'} hover:bg-surface-container-high transition-colors`}
                  >
                    <td className="py-2 px-2 text-secondary whitespace-nowrap">{utcLabel}</td>
                    <td className="py-2 px-2">
                      <div className="font-bold text-on-surface font-sans text-xs">
                        {(item.vesselName || 'UNKNOWN').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-outline">{item.mmsi || '—'}</div>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sevClass}`}>
                        {incidentLabel}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-on-surface-variant text-[11px] max-w-[160px] truncate">
                      {item.title || '—'}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {isCritical ? (
                        <button
                          onClick={() => handleAction(item)}
                          className="px-2.5 py-1 bg-red-500 text-white font-sans text-[11px] font-bold uppercase rounded hover:bg-red-600 shadow-sm transition-colors"
                        >
                          TRIAGE
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(item)}
                          className="px-2.5 py-1 bg-surface-container-highest text-cyan-300 font-sans text-[11px] font-bold uppercase rounded hover:bg-cyan-400 hover:text-black shadow-sm transition-colors"
                        >
                          VIEW
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer bar */}
      <div className="flex items-center justify-between text-outline text-xs mt-3 pt-2 bg-surface-container-lowest/40 -mx-4 -mb-4 p-3 rounded-b-lg border-t border-outline-variant/20">
        <span className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          Real-time interdiction pipeline active
        </span>
        <button
          onClick={() => navigate('/Alerts')}
          className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold text-xs uppercase transition-colors"
        >
          Full Queue ({openAlertsTotal}) →
        </button>
      </div>
    </div>
  );
}
