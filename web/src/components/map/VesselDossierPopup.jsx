import React from 'react';
import { Crosshair, FileText, Maximize2, Minus, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { formatLatLon } from '../../lib/coords.js';

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const iconBtn =
  'w-8 h-8 grid place-items-center rounded-sm text-bs-neutral-700 hover:bg-bs-ink/[.07] outline-none focus-visible:outline-bs-accent';
const actionBtn =
  'flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-sm border text-[13px] font-semibold outline-none focus-visible:outline-bs-accent';

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const metres = (v) => (v == null || v === '' ? null : String(v).includes('m') ? String(v) : `${v} m`);

export default function VesselDossierPopup({
  vessel = null,
  left = 24,
  isMinimized = false,
  onToggleMinimize,
  onClose,
  onTrack,
  onIntercept,
  onViewProfile,
}) {
  if (!vessel) return null;

  const vesselName = vessel.name || vessel.ship_name || `Vessel ${vessel.mmsi || vessel.id || ''}`;
  const threatLevel = (vessel.threatLevel || (vessel.anomaly ? 'CRITICAL' : 'NORMAL')).toUpperCase();
  const isCritical = threatLevel === 'CRITICAL';
  const isWarning = threatLevel === 'WARNING';
  const isAlert = isCritical || isWarning;

  const tag = isAlert ? 'bg-bs-accent-2-100 text-bs-accent-2-700' : 'bg-bs-neutral-100 text-bs-neutral-800';
  const statusLabel = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Normal';

  const threatReason =
    vessel.threatReason ||
    (isCritical ? 'High-risk activity detected' : isWarning ? 'Course or transponder anomaly' : 'Standard navigation');
  const threatDetail =
    vessel.threatDetail ||
    (isCritical
      ? 'Kinematic deviation or exclusion zone violation.'
      : isWarning
      ? 'Non-standard speed or course deviation observed.'
      : 'Live AIS transmission, no anomalies detected.');

  const sog = num(vessel.sog ?? vessel.speed);
  const cog = num(vessel.cog ?? vessel.course);
  const position = Array.isArray(vessel.position) && vessel.position.length >= 2
    ? formatLatLon(vessel.position[0], vessel.position[1])
    : vessel.coordinates || '—';

  const length = metres(vessel.length);
  const beam = metres(vessel.beam);
  const draught = metres(vessel.draught);
  const dimensions = [length && beam ? `${length} × ${beam}` : length || beam, draught && `draft ${draught}`]
    .filter(Boolean)
    .join(', ') || '—';

  const pos = { left };

  if (isMinimized) {
    return (
      <div style={pos} className="absolute top-[76px] z-30 flex items-center gap-2 pl-3 pr-1 py-1 bg-bs-bg text-bs-ink shadow-bs-lg">
        <button
          onClick={onToggleMinimize}
          className="flex items-center gap-2 py-1 outline-none focus-visible:outline-bs-accent"
          title="Expand vessel card"
        >
          <span className="font-semibold text-[14px] truncate max-w-[180px]">{vesselName}</span>
          <span className={`text-[11px] px-2 py-px rounded-sm ${tag}`}>{statusLabel}</span>
          <Maximize2 size={14} className="text-bs-neutral-700" />
        </button>
        <button onClick={onClose} className={iconBtn} aria-label="Close">
          <X size={16} />
        </button>
      </div>
    );
  }

  const Banner = isAlert ? TriangleAlert : ShieldCheck;

  return (
    <div style={pos} className="absolute top-[76px] w-[380px] z-30 bg-bs-bg text-bs-ink shadow-bs-lg px-6 pt-5 pb-6 font-sans">
      {/* Name, status, identifiers */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-semibold text-[22px] leading-[1.1] tracking-[-0.01em] truncate">{vesselName}</h3>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-sm ${tag}`}>{statusLabel}</span>
          </div>
          <div className="mt-1 text-[12px] font-mono text-bs-neutral-700 tabular-nums">
            MMSI {vessel.mmsi || vessel.id || '—'} · IMO {vessel.imo || '—'}
            {vessel.callSign && vessel.callSign !== 'N/A' && <> · {vessel.callSign}</>}
          </div>
        </div>
        {onToggleMinimize && (
          <button onClick={onToggleMinimize} className={iconBtn} aria-label="Minimise">
            <Minus size={16} />
          </button>
        )}
        <button onClick={onClose} className={iconBtn} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* Status banner */}
      <div className={`mt-5 flex gap-2.5 ${isAlert ? 'text-bs-accent-2-700' : 'text-bs-accent-700'}`}>
        <Banner size={20} className="shrink-0 mt-px" />
        <div>
          <div className="font-semibold text-[14px]">{threatReason}</div>
          <div className="text-[13px] italic text-bs-ink [text-wrap:pretty]">{threatDetail}</div>
        </div>
      </div>

      {/* Kinematics & identity */}
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <div className={kicker}>Speed over ground</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-semibold text-[34px] leading-none text-bs-accent-700 tabular-nums">
              {sog == null ? '—' : sog.toFixed(1)}
            </span>
            <span className="text-[13px] italic">knots</span>
          </div>
        </div>
        <div>
          <div className={kicker}>Course over ground</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-semibold text-[34px] leading-none text-bs-accent-700 tabular-nums">
              {cog == null ? '—' : `${Math.round(cog)}°`}
            </span>
            <span className="text-[13px] italic">true</span>
          </div>
        </div>
        <div>
          <div className={kicker}>Vessel type</div>
          <div className="mt-0.5 text-[16px] font-semibold truncate">{vessel.type || '—'}</div>
        </div>
        <div>
          <div className={kicker}>Flag state</div>
          <div className="mt-0.5 text-[16px] font-semibold truncate">{vessel.flag || '—'}</div>
        </div>
      </div>

      {/* Details */}
      <dl className="mt-5 text-[13px] divide-y divide-bs-ink/[.08]">
        {[
          ['Position', <span className="font-mono text-[12px] tabular-nums">{position}</span>],
          ['Navigation status', vessel.navStatus || '—'],
          ['Dimensions', <span className="tabular-nums">{dimensions}</span>],
          ['Destination', vessel.destination || '—'],
          ['Last broadcast', <span className="text-bs-accent-700">{vessel.lastReport || 'Live AIS ingest'}</span>],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-[7px]">
            <dt className="text-bs-neutral-700 shrink-0">{label}</dt>
            <dd className="text-right truncate">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Actions */}
      <div className="mt-5 flex gap-2.5">
        <button onClick={onTrack} className={`${actionBtn} border-bs-ink/[.16] hover:bg-bs-ink/[.07]`}>
          <Crosshair size={16} />
          Track
        </button>
        <button
          onClick={onIntercept}
          className={`${actionBtn} border-bs-accent-2 text-bs-accent-2-700 hover:bg-bs-accent-2-100`}
        >
          <TriangleAlert size={16} />
          Intercept
        </button>
        <button
          onClick={onViewProfile}
          className={`${actionBtn} border-transparent bg-bs-accent text-bs-bg hover:bg-bs-accent-700`}
        >
          <FileText size={16} />
          Dossier
        </button>
      </div>
    </div>
  );
}
