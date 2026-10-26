import React, { useState } from 'react';

/**
 * Format UTC timestamp to operator-friendly string
 */
function formatUtcTimestamp(isoString) {
  if (!isoString) return 'Live AIS';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return String(isoString);
  }
}

export default function RestrictedAreasIncursionsDrawer({
  selectedZone,
  incursions = [],
  isLoadingIncursions = false,
  isScanningBreaches = false,
  onRunBreachCheck,
  onRefreshDetections,
  onTrackVessel,
  onEditPolygon,
  onDeleteZone,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExportCsv = () => {
    if (!incursions || incursions.length === 0) return;
    const headers = [
      'Vessel Name',
      'MMSI',
      'Restricted Area ID',
      'Restricted Zone',
      'Classification',
      'Time (UTC)',
      'SOG (kn)',
      'COG (deg)',
      'Latitude',
      'Longitude',
    ];

    const rows = incursions.map((i) => [
      `"${i.ship_name || `VESSEL ${i.mmsi}`}"`,
      i.mmsi,
      i.restricted_area_id || selectedZone?.id || '',
      `"${i.restricted_zone || selectedZone?.name || ''}"`,
      i.restricted_area_type || selectedZone?.type || '',
      `"${i.time_utc || ''}"`,
      i.sog != null ? Number(i.sog).toFixed(1) : '',
      i.cog != null ? Number(i.cog).toFixed(0) : '',
      i.lat != null ? Number(i.lat).toFixed(6) : '',
      i.lon != null ? Number(i.lon).toFixed(6) : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `incursions_${(selectedZone?.name || 'zone').replace(/\s+/g, '_')}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasIncursions = incursions.length > 0;

  return (
    <div className="w-full bg-surface-container-low border-t border-outline-variant/40 flex flex-col shrink-0 z-30 transition-all duration-300 shadow-2xl font-sans select-none">
      {/* Drawer Header */}
      <div className="h-11 px-4 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-[18px] ${
                hasIncursions ? 'text-red-500 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {hasIncursions ? 'crisis_alert' : 'shield'}
            </span>
            <span className="text-xs font-bold text-on-surface tracking-wide uppercase font-mono">
              {selectedZone ? selectedZone.name : 'Select a Restricted Zone'}
            </span>
          </div>

          {selectedZone && (
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
              {selectedZone.category || selectedZone.type}
            </span>
          )}

        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          

          <div className="h-4 w-px bg-outline-variant/40 mx-1" />

          {onEditPolygon && (
            <button
              type="button"
              onClick={onEditPolygon}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded border border-outline-variant/40 hover:border-cyan-400 text-on-surface hover:text-cyan-400 transition-all font-mono text-[11px] uppercase font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span>Edit</span>
            </button>
          )}

          {onDeleteZone && (
            <button
              type="button"
              onClick={onDeleteZone}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded border border-red-500/30 hover:bg-red-950/30 text-red-400 transition-all font-mono text-[11px] uppercase font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              <span>Delete Zone</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Details' : 'Expand Details'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
            </span>
          </button>
        </div>
      </div>

      {/* Drawer Body Content: 30% Rules / 70% Incursion Table */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-12 gap-4 max-h-56 overflow-y-auto">
          {/* Column Left (4 Cols): Operational Directives & Parameters */}
          <div className="col-span-12 lg:col-span-4 flex flex-col justify-between gap-2.5 bg-surface-container-lowest/60 p-3 rounded border border-outline-variant/20">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-outline uppercase">Class:</span>
                <span className="text-on-surface font-semibold">
                  {selectedZone?.category || 'Standard Restricted Area'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-outline uppercase">Spatial Boundary:</span>
                <span className="text-cyan-400 font-semibold">
                  {selectedZone?.vertices || selectedZone?.coordinates?.length || 0} vertices • SRID 4326
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-outline uppercase">Geofence Status:</span>
                <span className="text-emerald-400 font-semibold">
                  {selectedZone?.active !== false ? 'Live Enforcement' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Incursion Alert or Safe Banner */}
            {hasIncursions ? (
              <div className="p-2 rounded bg-red-950/40 border border-red-500/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[20px] animate-pulse shrink-0">
                    warning
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-red-400 uppercase leading-tight">
                      {incursions.length} TARGET{incursions.length > 1 ? 'S' : ''} IN BOUNDARY
                    </span>
                    <span className="font-mono text-[10px] text-red-300 leading-tight">
                      Unauthorized entry detected in PostGIS scan
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRunBreachCheck}
                  disabled={isScanningBreaches}
                  className="px-2.5 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-opacity shadow-[0_0_8px_rgba(239,68,68,0.4)] whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {isScanningBreaches ? 'Scanning...' : 'Dispatch Alert'}
                </button>
              </div>
            ) : (
              <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0">
                    verified_user
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-emerald-400 uppercase leading-tight">
                      NO ACTIVE BREACHES
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRunBreachCheck}
                  disabled={isScanningBreaches}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer"
                >
                  Force Scan
                </button>
              </div>
            )}
          </div>

          {/* Column Right (8 Cols): Recent Incursions Table */}
          <div className="col-span-12 lg:col-span-8 flex flex-col bg-surface-container-lowest/60 rounded border border-outline-variant/20 overflow-hidden">
            <div className="px-3 py-1.5 bg-surface-container-highest/60 border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold text-on-surface">
                  Vessel Incursions &amp; Intersections
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[11px] font-bold border ${
                    hasIncursions
                      ? 'bg-red-950/80 text-red-400 border-red-500/40'
                      : 'bg-surface-container text-outline border-outline-variant/30'
                  }`}
                >
                  {incursions.length} Total
                </span>
              </div>

              {hasIncursions && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1 font-mono text-xs text-cyan-400 hover:underline cursor-pointer"
                  title="Export detection records to CSV"
                >
                  <span className="material-symbols-outlined text-[13px]">file_download</span>
                  <span>Export Logs (.CSV)</span>
                </button>
              )}
            </div>

            {/* Incursions Table or Empty State */}
            <div className="overflow-x-auto flex-1">
              {isLoadingIncursions ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 font-mono text-xs text-outline">
                  <span className="material-symbols-outlined text-xl text-cyan-400 animate-spin">
                    progress_activity
                  </span>
                  <span>Querying PostGIS spatial intersections...</span>
                </div>
              ) : incursions.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 font-mono text-xs text-outline">
                  <span className="material-symbols-outlined text-2xl text-emerald-400/60">
                    check_circle
                  </span>
                  <p className="m-0">
                    No vessels currently intersecting this geofenced perimeter.
                  </p>
                  <span className="text-[10px] text-outline/60">
                    Execute "Run Breach Check" to evaluate latest AIS telemetry.
                  </span>
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high/40 text-outline border-b border-outline-variant/20 text-[10px] uppercase">
                      <th className="py-1.5 px-3">Vessel Name</th>
                      <th className="py-1.5 px-3">MMSI</th>
                      <th className="py-1.5 px-3">Timestamp (UTC)</th>
                      <th className="py-1.5 px-3 text-right">SOG</th>
                      <th className="py-1.5 px-3 text-right">COG</th>
                      <th className="py-1.5 px-3 text-right">Coordinates</th>
                      <th className="py-1.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-xs">
                    {incursions.map((inc, idx) => (
                      <tr
                        key={`${inc.mmsi}-${inc.time_utc || idx}`}
                        className="hover:bg-surface-container/60 transition-colors bg-red-950/10"
                      >
                        <td className="py-1.5 px-3 font-semibold text-on-surface flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {inc.ship_name || `VESSEL ${inc.mmsi}`}
                          </span>
                        </td>

                        <td className="py-1.5 px-3 text-outline">{inc.mmsi}</td>

                        <td className="py-1.5 px-3 text-red-300">
                          {formatUtcTimestamp(inc.time_utc)}
                        </td>

                        <td className="py-1.5 px-3 text-right text-cyan-400 font-bold">
                          {inc.sog != null ? `${Number(inc.sog).toFixed(1)} kn` : '0.0 kn'}
                        </td>

                        <td className="py-1.5 px-3 text-right text-on-surface">
                          {inc.cog != null ? `${Number(inc.cog).toFixed(0)}°` : '—'}
                        </td>

                        <td className="py-1.5 px-3 text-right text-[11px] text-outline">
                          {inc.lat != null && inc.lon != null
                            ? `${Number(inc.lat).toFixed(3)}°, ${Number(inc.lon).toFixed(3)}°`
                            : '—'}
                        </td>

                        <td className="py-1.5 px-3 text-center">
                          {onTrackVessel && (
                            <button
                              type="button"
                              onClick={() => onTrackVessel(inc)}
                              className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
                              title="Lock and track target telemetry"
                            >
                              Track
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
