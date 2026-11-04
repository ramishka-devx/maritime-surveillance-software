import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Crosshair, TriangleAlert } from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../auth/AuthContext.jsx';

const SEVERITY_TYPE = { critical: 'CRITICAL', high: 'WARNING', medium: 'WARNING', low: 'INFO' };

function ago(iso) {
  if (!iso) return '';
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} d ago`;
}

const toStreamAlert = (a) => ({
  id: a.alert_id,
  title: a.title,
  vesselName: a.vessel_name || 'Unknown vessel',
  mmsi: a.mmsi,
  type: SEVERITY_TYPE[a.severity] || 'INFO',
  time: ago(a.created_at),
  details: a.description,
  lat: a.lat,
  lon: a.lon,
  acknowledged: a.status === 'acknowledged',
});

export default function AlertsStream({
  isOpen = false,
  onToggle,
  onFocusAlert,
}) {
  const { token } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!token) return undefined;
    let stale = false;
    const load = () =>
      apiRequest('/api/alerts?status=open,acknowledged,escalated&sort=severity&limit=100', { token })
        .then((res) => !stale && setAlerts((res.rows || []).map(toStreamAlert)))
        .catch(() => {});
    load();
    const timer = setInterval(load, 15000);
    return () => {
      stale = true;
      clearInterval(timer);
    };
  }, [token]);

  const handleAcknowledge = (id, e) => {
    e.stopPropagation();
    apiRequest(`/api/alerts/${id}/status`, { token, method: 'PUT', body: { status: 'acknowledged' } })
      .then(() => setAlerts((prev) => prev.map((alt) => (alt.id === id ? { ...alt, acknowledged: true } : alt))))
      .catch(() => {});
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
      <div className="flex-1 overflow-y-auto scroll-thin border-t border-bs-ink/[.16] divide-y divide-bs-ink/[.08]">
        {filteredAlerts.length === 0 && (
          <p className="px-5 py-6 text-[13px] italic text-bs-neutral-700">No open alerts.</p>
        )}
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
