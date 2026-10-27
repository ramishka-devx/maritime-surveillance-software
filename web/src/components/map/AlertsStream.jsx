import React, { useState } from 'react';
import { Check, ChevronRight, Crosshair, TriangleAlert } from 'lucide-react';

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
        className="absolute right-6 top-5 z-30 inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-sm border border-bs-accent-2 bg-bs-bg shadow-bs-sm text-[13px] font-semibold text-bs-accent-2-700 hover:bg-bs-accent-2-100 outline-none focus-visible:outline-bs-accent"
        title="Open alert stream"
      >
        <TriangleAlert size={16} />
        Alerts
        <span className="tabular-nums">{unackCount}</span>
      </button>
    );
  }

  const sevTag = {
    CRITICAL: 'bg-bs-accent-2-100 text-bs-accent-2-700',
    WARNING: 'bg-bs-accent-2-100 text-bs-accent-2-500',
    INFO: 'bg-bs-neutral-100 text-bs-neutral-800',
  };

  return (
    <div className="absolute right-6 top-5 bottom-5 w-[340px] z-30 flex flex-col bg-bs-bg text-bs-ink shadow-bs-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-semibold text-[17px]">Alerts</h2>
          <span className="text-[12px] italic text-bs-accent-2-700">{unackCount} new</span>
        </div>
        <button
          onClick={onToggle}
          className="w-8 h-8 grid place-items-center rounded-sm text-bs-neutral-700 hover:bg-bs-ink/[.07] outline-none focus-visible:outline-bs-accent"
          aria-label="Close alerts"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Severity filter */}
      <div className="px-5 pb-3">
        <div className="inline-flex border border-bs-ink/[.16] rounded-sm overflow-hidden text-[12px]">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-2.5 py-1.5 capitalize border-l border-bs-ink/[.16] first:border-l-0 ${
                filter === f ? 'bg-bs-accent text-bs-bg' : 'hover:bg-bs-ink/[.07]'
              }`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto border-t border-bs-ink/[.16] divide-y divide-bs-ink/[.08]">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => onFocusAlert && onFocusAlert(alert)}
            className={`px-5 py-3.5 cursor-pointer hover:bg-bs-surface ${alert.acknowledged ? 'opacity-60 hover:opacity-100' : ''}`}
          >
            <div className="flex items-center gap-2 text-[12px]">
              <span className={`px-2 py-px rounded-sm capitalize ${sevTag[alert.type] || sevTag.INFO}`}>
                {alert.type.toLowerCase()}
              </span>
              <span className="italic text-bs-neutral-700">{alert.time}</span>
              <span className="ml-auto text-bs-neutral-700 tabular-nums">{alert.confidence} confidence</span>
            </div>
            <h4 className="mt-1.5 text-[14px] font-semibold leading-snug">{alert.title}</h4>
            <div className="text-[12px] text-bs-accent-700 font-semibold">
              {alert.vesselName} <span className="font-mono font-normal text-bs-neutral-700">{alert.mmsi}</span>
            </div>
            <p className="mt-1 text-[13px] italic text-bs-neutral-800 leading-relaxed line-clamp-2">{alert.details}</p>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onFocusAlert) onFocusAlert(alert);
                }}
                className="inline-flex items-center gap-1 text-bs-accent-700 hover:underline underline-offset-[3px]"
              >
                <Crosshair size={13} />
                Show on map
              </button>
              {!alert.acknowledged ? (
                <button
                  onClick={(e) => handleAcknowledge(alert.id, e)}
                  className="px-2.5 py-1 rounded-sm border border-bs-ink/[.16] hover:bg-bs-ink/[.07] font-semibold"
                >
                  Acknowledge
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 italic text-bs-neutral-700">
                  <Check size={13} />
                  Acknowledged
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
