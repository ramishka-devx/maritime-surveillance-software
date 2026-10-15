import React from 'react';

export default function AlertsTable({
  alerts,
  selectedAlertIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onTriageAlert,
  onFocusOnMap,
}) {
  const allSelected = alerts.length > 0 && alerts.every((a) => selectedAlertIds.includes(a.id));
  const someSelected = alerts.some((a) => selectedAlertIds.includes(a.id)) && !allSelected;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Transponder Spoofing':
        return 'cell_tower';
      case 'Restricted Area Incursion':
        return 'security_update_warning';
      case 'Dark Vessel / AIS Lost':
        return 'portable_wifi_off';
      case 'Collision Risk (CPA Alert)':
      case 'Collision Risk':
        return 'alt_route';
      case 'Speed Anomaly':
        return 'speed';
      case 'Loitering Pattern':
        return 'sync_alt';
      case 'Unsanctioned STS Transfer':
        return 'directions_boat';
      case 'Draft Discrepancy':
        return 'waves';
      case 'Transponder Drift':
        return 'update';
      default:
        return 'warning';
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRIT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/50 font-mono text-[10px] font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            CRIT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/40 font-mono text-[10px] font-bold">
            HIGH
          </span>
        );
      case 'MED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/40 font-mono text-[10px] font-semibold">
            MED
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/30 font-mono text-[10px] font-medium">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest border border-cyan-400 text-cyan-400 font-mono text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            OPEN
          </span>
        );
      case 'ACKNOWLEDGED':
      case "ACK'D":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-medium">
            ACK'D
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-medium">
            RESOLVED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded border border-outline-variant/30 bg-surface-container-lowest shadow-md select-none font-sans">
      <table className="w-full text-left border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant/40 text-[11px] uppercase text-outline tracking-wider font-mono">
            <th className="p-3 w-10 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onToggleSelectAll}
                className="rounded bg-surface-container-lowest border-outline-variant text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
              />
            </th>
            <th className="py-3 px-2 font-bold text-on-surface-variant">SEV</th>
            <th className="py-3 px-3 font-bold text-on-surface-variant">Alert Type</th>
            <th className="py-3 px-3 font-bold text-on-surface-variant">Vessel Name / Ident</th>
            <th className="py-3 px-3 font-bold text-on-surface-variant">Coordinates & Sector</th>
            <th className="py-3 px-3 font-bold text-on-surface-variant">Detected (UTC)</th>
            <th className="py-3 px-3 font-bold text-on-surface-variant">Status</th>
            <th className="py-3 px-3 font-bold text-on-surface-variant text-right">Direct Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-outline-variant/20 text-xs text-on-surface">
          {alerts.map((alert) => {
            const isSelected = selectedAlertIds.includes(alert.id);
            const isCrit = alert.severity === 'CRIT';

            return (
              <tr
                key={alert.id}
                onClick={() => onToggleSelectRow(alert.id)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-surface-container-high/80 border-l-4 border-cyan-400 shadow-[inset_0_0_12px_rgba(34,211,238,0.08)]'
                    : alert.status === 'RESOLVED'
                    ? 'opacity-70 hover:opacity-100 hover:bg-surface-container-high/30'
                    : 'hover:bg-surface-container-high/40'
                }`}
              >
                {/* Row Checkbox */}
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectRow(alert.id)}
                    className="alert-row-check rounded bg-surface-container border-outline-variant text-cyan-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                  />
                </td>

                {/* Severity Badge */}
                <td className="py-3 px-2">{getSeverityBadge(alert.severity)}</td>

                {/* Alert Type */}
                <td className="py-3 px-3">
                  <div
                    className={`flex items-center gap-1.5 font-semibold ${
                      isCrit ? 'text-red-400' : alert.severity === 'HIGH' ? 'text-amber-300' : 'text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {getTypeIcon(alert.type)}
                    </span>
                    <span>{alert.type}</span>
                  </div>
                </td>

                {/* Vessel Name & Ident */}
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-bold text-on-surface">
                      <span className="text-cyan-400 font-mono text-[10px]">[{alert.flag || 'PA'}]</span>
                      <span>{alert.vesselName}</span>
                    </div>
                    <div className="font-mono text-[11px] text-outline">
                      MMSI: <span className="text-cyan-300">{alert.mmsi}</span>
                    </div>
                  </div>
                </td>

                {/* Coordinates & Sector */}
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-on-surface font-semibold">
                      {alert.coordinates}
                    </span>
                    <span className="text-[10px] text-cyan-400 uppercase font-mono">
                      {alert.sector}
                    </span>
                  </div>
                </td>

                {/* Timestamp */}
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-on-surface font-medium">
                      {alert.timeUtc}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        isCrit ? 'text-red-400 font-bold' : 'text-outline'
                      }`}
                    >
                      {alert.elapsed}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-3">{getStatusBadge(alert.status)}</td>

                

                {/* Direct Actions */}
                <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onTriageAlert && onTriageAlert(alert)}
                      className="px-2.5 py-1 rounded bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold uppercase hover:brightness-110 shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all"
                    >
                      Triage
                    </button>
                    <button
                      onClick={() => onFocusOnMap && onFocusOnMap(alert)}
                      className="p-1 rounded text-outline hover:text-cyan-400 hover:bg-surface-container transition-colors"
                      title="Lock Viewport on Map"
                    >
                      <span className="material-symbols-outlined text-[18px]">my_location</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {alerts.length === 0 && (
            <tr>
              <td colSpan={9} className="py-12 text-center text-outline font-mono text-xs">
                No surveillance alerts found in queue.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
