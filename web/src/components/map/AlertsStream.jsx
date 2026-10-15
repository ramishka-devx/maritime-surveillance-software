import React, { useState } from 'react';

export default function AlertsStream({
  isOpen = false,
  onToggle,
  onFocusAlert,
}) {
  const [filter, setFilter] = useState('ALL');
  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-9041',
      title: 'AIS Identity Spoofing Detected',
      vesselName: 'MV NORDIC SENTINEL',
      mmsi: '211284000',
      type: 'CRITICAL',
      time: '2s ago',
      details: 'Dual position reports received. Kinematics exceed hull displacement limits by 3.4x.',
      confidence: '94%',
      targetCoords: { x: 580, y: 340 },
      acknowledged: false,
    },
    {
      id: 'ALT-9040',
      title: 'Geofence Incursion: Sector Bravo-4',
      vesselName: 'OCEAN VOYAGER',
      mmsi: '235089200',
      type: 'CRITICAL',
      time: '1m ago',
      details: 'Unscheduled entry into naval munitions holding zone without clearance beacon.',
      confidence: '98%',
      targetCoords: { x: 920, y: 280 },
      acknowledged: false,
    },
    {
      id: 'ALT-9039',
      title: 'AIS Transponder Dark Event',
      vesselName: 'STELLA MARIS',
      mmsi: '244780000',
      type: 'WARNING',
      time: '4m ago',
      details: 'Signal lost in Dover TSS inbound corridor. Last recorded speed was 16.2 KTS.',
      confidence: '89%',
      targetCoords: { x: 640, y: 310 },
      acknowledged: false,
    },
    {
      id: 'ALT-9038',
      title: 'Gross Course Deviation (>45°)',
      vesselName: 'PACIFIC OPAL',
      mmsi: '352981000',
      type: 'WARNING',
      time: '8m ago',
      details: 'Departed assigned TSS lane into oncoming separation zone. Potential collision hazard.',
      confidence: '91%',
      targetCoords: { x: 1130, y: 390 },
      acknowledged: true,
    },
    {
      id: 'ALT-9037',
      title: 'Potential Ship-to-Ship (STS) Rendezvous',
      vesselName: 'SEA SWIFT // UNREGISTERED',
      mmsi: '311000452',
      type: 'INFO',
      time: '14m ago',
      details: 'Two targets drifting in contact distance (<50m) in unmonitored sector for 22 mins.',
      confidence: '86%',
      targetCoords: { x: 480, y: 140 },
      acknowledged: false,
    },
  ]);

  const handleAcknowledge = (id, e) => {
    e.stopPropagation();
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === id ? { ...alt, acknowledged: true } : alt))
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.type === filter;
  });

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-20 z-30 flex items-center gap-2 px-3 py-2 bg-surface-container-low/90 backdrop-blur-md border border-red-500/40 rounded text-xs font-mono text-red-400 hover:bg-surface-container shadow-xl transition-all"
        title="Open Alert Stream"
      >
        <span className="material-symbols-outlined text-[16px] text-red-400 animate-pulse">
          warning
        </span>
        <span>ALERTS ({unackCount})</span>
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-20 bottom-16 w-84 bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/40 rounded-lg shadow-2xl z-30 flex flex-col font-sans overflow-hidden transition-all duration-300">
      {/* Alerts Stream Header */}
      <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/80">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-[18px]">emergency</span>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">Live Threat Stream</h2>
          <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[10px] font-mono text-red-400 font-bold">
            {unackCount} NEW
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors"
          title="Minimize Alerts"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-outline-variant/20 flex gap-1 font-mono text-[10px] bg-surface-container-lowest/50">
        {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === f
                ? 'bg-primary-container text-on-primary font-bold'
                : 'text-outline hover:text-on-surface bg-surface-container-lowest'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.type === 'CRITICAL';
          const isWarning = alert.type === 'WARNING';

          return (
            <div
              key={alert.id}
              onClick={() => onFocusAlert && onFocusAlert(alert)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                alert.acknowledged
                  ? 'bg-surface-container-lowest/60 border-outline-variant/20 opacity-70 hover:opacity-100'
                  : isCritical
                  ? 'bg-red-950/20 border-red-500/50 hover:border-red-400 shadow-lg shadow-red-950/10'
                  : isWarning
                  ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                  : 'bg-surface-container-lowest border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              {/* Alert Header Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCritical ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                  />
                  <span
                    className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCritical
                        ? 'bg-red-950/80 text-red-300 border border-red-500/30'
                        : isWarning
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {alert.type}
                  </span>
                  <span className="font-mono text-[10px] text-outline">{alert.time}</span>
                </div>
                <span className="font-mono text-[9px] text-cyan-400/90 font-semibold">
                  AI {alert.confidence}
                </span>
              </div>

              {/* Title & Vessel */}
              <h4 className="text-xs font-bold text-on-surface mt-1.5 leading-snug">
                {alert.title}
              </h4>
              <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                {alert.vesselName} <span className="text-outline">({alert.mmsi})</span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-outline leading-relaxed mt-1 line-clamp-2">
                {alert.details}
              </p>

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between font-mono text-[10px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onFocusAlert) onFocusAlert(alert);
                  }}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">location_searching</span>
                  <span>FOCUS TARGET</span>
                </button>
                {!alert.acknowledged ? (
                  <button
                    onClick={(e) => handleAcknowledge(alert.id, e)}
                    className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40 hover:bg-surface-container-highest text-on-surface transition-colors"
                  >
                    ACKNOWLEDGE
                  </button>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    <span>ACK'D</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stream Footer */}
      <div className="p-2.5 border-t border-outline-variant/30 bg-surface-container-lowest/90 font-mono text-[10px] text-outline flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>NEURAL SURVEILLANCE RUNNING</span>
        </span>
        <button className="text-cyan-400 hover:underline">EXPORT LOG</button>
      </div>
    </div>
  );
}
