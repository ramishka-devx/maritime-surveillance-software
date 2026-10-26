import React from 'react';

export default function VesselDossierPopup({
  vessel = null,
  isMinimized = false,
  onToggleMinimize,
  onClose,
  onTrack,
  onIntercept,
  onViewProfile,
}) {
  if (!vessel) return null;

  console.log('vessel',vessel)

  // Format position coordinates if not pre-formatted string
  const formatCoords = (pos) => {
    if (!pos || !Array.isArray(pos) || pos.length < 2) return null;
    const lat = pos[0];
    const lng = pos[1];
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(1);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDeg = Math.floor(Math.abs(lng));
    const lngMin = ((Math.abs(lng) - lngDeg) * 60).toFixed(1);
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${latDeg}°${latMin}'${latDir} 00${lngDeg}°${lngMin}'${lngDir}`;
  };

  const vesselName = vessel.name || vessel.ship_name || `VESSEL ${vessel.mmsi || vessel.id || 'TARGET'}`;
  const threatLevel = (vessel.threatLevel || (vessel.anomaly ? 'CRITICAL' : 'NORMAL')).toUpperCase();
  const isCritical = threatLevel === 'CRITICAL';
  const isWarning = threatLevel === 'WARNING';

  // Dynamic status colors based on threat level
  const containerBorder = isCritical
    ? 'border-red-500/50 shadow-red-950/20'
    : isWarning
    ? 'border-amber-500/50 shadow-amber-950/20'
    : 'border-cyan-500/40 shadow-cyan-950/20';

  const badgeClass = isCritical
    ? 'bg-red-500/20 text-red-400 border-red-500/40'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

  const bannerBg = isCritical
    ? 'bg-red-950/40 border-red-500/30 text-red-300'
    : isWarning
    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
    : 'bg-surface-container-lowest/80 border-outline-variant/30 text-cyan-300';

  const bannerIcon = isCritical ? 'warning' : isWarning ? 'report_problem' : 'verified_user';
  const bannerIconColor = isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400';

  const threatReason =
    vessel.threatReason ||
    (isCritical
      ? 'High Risk Threat Detected'
      : isWarning
      ? 'Course / Transponder Anomaly'
      : 'Nominal Surveillance Profile');

  const threatDetail =
    vessel.threatDetail ||
    (isCritical
      ? 'Kinematic deviation or exclusion zone violation.'
      : isWarning
      ? 'Non-standard speed or course deviation observed.'
      : 'Transponder beacon active. Kinematic parameters nominal.');

  // Telemetry mapping with fallbacks from white popup fields
  const displaySog = vessel.sog
    ? String(vessel.sog).toUpperCase().includes('KT')
      ? vessel.sog
      : `${vessel.sog} KTS`
    : vessel.speed != null
    ? `${vessel.speed} KTS`
    : '0.0 KTS';

  const displayCog = vessel.cog
    ? String(vessel.cog).includes('°')
      ? vessel.cog
      : `${vessel.cog}° T`
    : vessel.course != null
    ? `${vessel.course}° T`
    : '000° T';

  const displayCoords =
    vessel.coordinates || formatCoords(vessel.position) || "51°14'22.1\"N 001°32'48.4\"E";

  const vesselLength = vessel.length
    ? String(vessel.length).includes('m')
      ? vessel.length
      : `${vessel.length} m`
    : '180 m';

  const vesselBeam = vessel.beam
    ? String(vessel.beam).includes('m')
      ? vessel.beam
      : `${vessel.beam} m`
    : '26 m';

  const vesselDraught = vessel.draught
    ? String(vessel.draught).includes('m')
      ? vessel.draught
      : `${vessel.draught} m`
    : '8.5 m';

  if (isMinimized) {
    return (
      <div
        className={`fixed top-20 left-[380px] z-30 flex items-center gap-2 px-3 py-2 bg-surface-container-low/95 backdrop-blur-md border ${containerBorder} rounded text-xs font-mono text-on-surface shadow-xl hover:bg-surface-container transition-all`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={onToggleMinimize}
          title="Expand Vessel Dossier"
        >
          <span className={`material-symbols-outlined text-[16px] ${bannerIconColor} animate-pulse`}>
            {isCritical ? 'crisis_alert' : 'directions_boat'}
          </span>
          <span className="font-bold uppercase tracking-wide truncate max-w-[140px] text-on-surface">
            {vesselName}
          </span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeClass}`}>
            {threatLevel}
          </span>
          <span className="material-symbols-outlined text-[16px] text-outline hover:text-cyan-400 ml-0.5">
            open_in_full
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-outline hover:text-red-400 p-0.5 rounded transition-colors ml-1 cursor-pointer"
          title="Dismiss Target"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-20 left-[380px] w-96 bg-surface-container-low/95 backdrop-blur-xl border ${containerBorder} rounded-lg shadow-2xl z-30 font-sans overflow-hidden animate-fadeIn`}
    >
      {/* Target Reticle Header */}
      <div className="p-3.5 bg-surface-container-lowest/90 border-b border-outline-variant/30 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`relative flex items-center justify-center w-8 h-8 rounded ${
              isCritical
                ? 'bg-red-950/60 border border-red-500/60 text-red-400'
                : isWarning
                ? 'bg-amber-950/60 border border-amber-500/60 text-amber-400'
                : 'bg-cyan-950/60 border border-cyan-500/60 text-cyan-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] animate-pulse">
              {isCritical ? 'crisis_alert' : 'directions_boat'}
            </span>
            {isCritical && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide text-on-surface uppercase truncate max-w-[180px]">
                {vesselName}
              </h3>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider border ${badgeClass}`}>
                {threatLevel}
              </span>
            </div>
            <div className="text-[11px] font-mono text-outline flex items-center gap-2 mt-0.5">
              <span>MMSI: {vessel.mmsi || vessel.id || 'N/A'}</span>
              <span>•</span>
              <span>IMO: {vessel.imo || 'N/A'}</span>
              {vessel.callSign && vessel.callSign !== 'N/A' && (
                <>
                  <span>•</span>
                  <span>{vessel.callSign}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors cursor-pointer"
              title="Minimize Dossier"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors cursor-pointer"
            title="Dismiss Target Card"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Surveillance / Threat Status Strip */}
      <div className={`px-3.5 py-2.5 border-b flex items-start gap-2.5 ${bannerBg}`}>
        <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${bannerIconColor}`}>
          {bannerIcon}
        </span>
        <div className="text-[11px]">
          <div className="font-bold font-mono tracking-wide uppercase">{threatReason}</div>
          <div className="opacity-80 text-[10px] mt-0.5 leading-snug">{threatDetail}</div>
        </div>
      </div>

      {/* Target Kinematics & Specifications Grid */}
      <div className="p-3.5 space-y-3 font-mono text-xs">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30">
            <span className="text-[9px] text-outline uppercase block">Speed Over Ground</span>
            <span className="text-sm font-bold text-cyan-400">{displaySog}</span>
          </div>
          <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30">
            <span className="text-[9px] text-outline uppercase block">Course Over Ground</span>
            <span className="text-sm font-bold text-cyan-400">{displayCog}</span>
          </div>
          <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30">
            <span className="text-[9px] text-outline uppercase block">Vessel Type</span>
            <span className="text-on-surface font-semibold truncate block">
              {vessel.type || 'Commercial'}
            </span>
          </div>
          <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30">
            <span className="text-[9px] text-outline uppercase block">Flag State</span>
            <span className="text-on-surface font-semibold truncate block">
              {vessel.flag || 'International'}
            </span>
          </div>
        </div>

        {/* Detailed Specs List */}
        <div className="space-y-1.5 pt-1 border-t border-outline-variant/20 text-[11px]">
          <div className="flex justify-between">
            <span className="text-outline">Pos:</span>
            <span className="text-on-surface font-semibold">{displayCoords}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Nav Status:</span>
            <span className="text-emerald-400 font-semibold">
              {vessel.navStatus || 'Underway Using Engine'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Dimensions:</span>
            <span className="text-on-surface">
              {vesselLength} × {vesselBeam} (Draft {vesselDraught})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Destination:</span>
            <span className="text-on-surface font-semibold">{vessel.destination || 'OPEN SEA'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Last Broadcast:</span>
            <span className="text-cyan-300">{vessel.lastReport || 'Live AIS Ingest'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <button
          onClick={onTrack}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-surface-container border border-outline-variant/50 text-cyan-400 hover:bg-cyan-950/40 hover:border-cyan-400 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">my_location</span>
          <span>TRACK</span>
        </button>
        <button
          onClick={onIntercept}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-950/60 border border-red-500/50 text-red-300 hover:bg-red-900/60 transition-colors font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">navigation</span>
          <span>INTERCEPT</span>
        </button>
        <button
          onClick={onViewProfile}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-primary-container text-on-primary font-bold hover:brightness-110 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">description</span>
          <span>DOSSIER</span>
        </button>
      </div>
    </div>
  );
}
