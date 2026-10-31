import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Map as MapIcon, Siren, UserPlus } from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { esriMapImage } from '../../lib/esriMap.js';
import { formatLatLon } from '../../lib/coords.js';
import { toUiVessel } from '../../lib/vessels.js';
import { flagFromMmsi } from '../../lib/mid.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

const TYPE_LABEL = {
  dark_vessel: 'Dark activity',
  geofence: 'Restricted area',
  speed: 'Speed anomaly',
  loitering: 'Loitering',
  route_deviation: 'Route deviation',
  collision_risk: 'Collision risk',
  manual: 'Manual report',
};
const FILTERS = [
  { name: 'All', types: null },
  { name: 'Dark activity', types: ['dark_vessel'] },
  { name: 'Restricted area', types: ['geofence'] },
  { name: 'Behaviour', types: ['loitering', 'speed', 'route_deviation'] },
];
// AIS navigational status codes (ITU-R M.1371).
const NAV_STATUS = {
  0: 'Underway using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted manoeuvrability',
  4: 'Constrained by draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Underway sailing',
  14: 'AIS-SART active',
  15: 'Not defined',
};

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const focusRing = 'outline-none focus-visible:outline-bs-accent';
const btn = `inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-sm border text-[13px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed ${focusRing}`;

const sevLabel = (s) => (s ? s[0].toUpperCase() + s.slice(1) : 'Medium');
const sevTag = (s) =>
  s === 'critical' || s === 'high' ? 'bg-bs-accent-2-100 text-bs-accent-2-700' : 'bg-bs-neutral-100 text-bs-neutral-800';

function statusOf(a) {
  if (a.status === 'escalated') return 'Escalated';
  if (a.status === 'dismissed') return 'Dismissed';
  if (a.status === 'resolved') return 'Resolved';
  if (a.status === 'acknowledged') return 'Acknowledged';
  return a.assigned_to == null ? 'Needs an owner' : 'In review';
}
const statusInk = (s) =>
  s === 'Needs an owner' || s === 'Escalated'
    ? 'text-bs-accent-2-700'
    : s === 'In review'
    ? 'text-bs-accent-700'
    : 'text-bs-neutral-700';

function ago(iso) {
  if (!iso) return '';
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} d ago`;
}

// "17:52 UTC", with the date in front when it isn't today (UTC).
function utc(iso, seconds = false) {
  if (!iso) return '—';
  const s = new Date(iso).toISOString();
  const time = s.slice(11, seconds ? 19 : 16);
  if (s.slice(0, 10) === new Date().toISOString().slice(0, 10)) return time;
  return `${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} ${time}`;
}

// Timeline line: detector events are sentences; operator events follow the actor's name.
const eventText = (e) => {
  if (!e.actor_id) return e.text;
  const s = `${e.actor_name || 'An operator'} ${e.text}`;
  return /[.!?]$/.test(s) ? s : `${s}.`;
};

const TRACK_BEFORE_MS = 2 * 3600 * 1000;
const TRACK_AFTER_MS = 30 * 60 * 1000;
const POSITION_RETENTION_MS = 7 * 24 * 3600 * 1000; // ais_positions keeps 7 days

const ASPECT = 3.5; // chart crop width / height
// Box around the track, area and position, padded and widened to the crop's aspect.
function cropBounds(points) {
  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  let [s, n, w, e] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const cy = (s + n) / 2;
  const cx = (w + e) / 2;
  let halfH = Math.max(0.05, ((n - s) / 2) * 1.6);
  let halfW = Math.max(halfH * ASPECT, ((e - w) / 2) * 1.35);
  halfH = Math.max(halfH, halfW / ASPECT);
  halfW = halfH * ASPECT;
  [s, n, w, e] = [cy - halfH, cy + halfH, cx - halfW, cx + halfW];
  return { s, n, w, e };
}

// Map crop around where the alert happened: the track in the window around detection, the
// restricted zone (geofence alerts) and a marker at the detection position.
function ChartCrop({ alert, detail, onOpenMap }) {
  const track = (detail?.track || []).filter((p) => p.lat != null && p.lon != null);
  const atDetection = alert.lat != null && alert.lon != null;
  const latest = atDetection
    ? [Number(alert.lat), Number(alert.lon)]
    : detail?.vessel?.lat != null
    ? [Number(detail.vessel.lat), Number(detail.vessel.lon)]
    : track[0]
    ? [track[0].lat, track[0].lon]
    : null;
  const ring = detail?.area?.type === 'Polygon' ? detail.area.coordinates[0] : null;
  const expired = detail?.trackExpired;

  if (!detail) return <Skeleton className="mt-[18px] w-full" style={{ aspectRatio: ASPECT }} />;
  if (!latest) {
    return (
      <div className="mt-[18px] w-full grid place-items-center text-[13px] italic text-bs-neutral-700 shadow-[inset_0_0_0_1px_rgb(var(--bs-neutral-200))]" style={{ aspectRatio: ASPECT }}>
        No AIS position on record for {alert.mmsi ? `MMSI ${alert.mmsi}` : 'this vessel'}.
      </div>
    );
  }

  const b = cropBounds([latest, ...track.map((p) => [p.lat, p.lon]), ...(ring || []).map(([lon, lat]) => [lat, lon])]);
  const pct = ([lat, lon]) => ({ left: `${((lon - b.w) / (b.e - b.w)) * 100}%`, top: `${((b.n - lat) / (b.n - b.s)) * 100}%` });
  // Course at detection: the track point closest to the alert time, else the latest report.
  const detectedMs = new Date(alert.created_at).getTime();
  const nearest = track.reduce(
    (best, p) => (!best || Math.abs(new Date(p.time_utc) - detectedMs) < Math.abs(new Date(best.time_utc) - detectedMs) ? p : best),
    null
  );
  const heading = Number(nearest?.cog ?? detail.vessel?.cog ?? 0);
  const alerted = alert.severity === 'critical' || alert.severity === 'high';
  const markInk = alerted ? 'accent-2' : 'accent';

  return (
    <div className="relative mt-[18px] w-full overflow-hidden shadow-[inset_0_0_0_1px_rgb(var(--bs-neutral-200))]" style={{ aspectRatio: ASPECT }}>
      <img src={esriMapImage('World_Light_Gray_Base', b, 900)} alt="" className="absolute inset-0 w-full h-full" />
      <img src={esriMapImage('World_Light_Gray_Reference', b, 900)} alt="" className="absolute inset-0 w-full h-full opacity-70" />
      {/* Overlay in degrees (x = lon, y = -lat) over the same box as the image. */}
      <svg viewBox={`${b.w} ${-b.n} ${b.e - b.w} ${b.n - b.s}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {ring && (
          <polygon
            points={ring.map(([lon, lat]) => `${lon},${-lat}`).join(' ')}
            fill="rgb(var(--bs-accent-2-100))" fillOpacity="0.7" stroke="rgb(var(--bs-accent-2))"
            strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke"
          />
        )}
        {track.length > 1 && (
          <polyline
            points={track.map((p) => `${p.lon},${-p.lat}`).join(' ')}
            fill="none" stroke={`rgb(var(--bs-${markInk}))`} strokeWidth="1.6" strokeDasharray="1 4"
            strokeLinecap="round" vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <span className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center" style={pct(latest)}>
        <span className="absolute inset-0 border border-dashed" style={{ borderColor: `rgb(var(--bs-${markInk}))` }} />
        <svg width="14" height="14" viewBox="-7 -7 14 14" style={{ transform: `rotate(${heading}deg)` }} aria-hidden="true">
          <path d="M0 -6 L4.5 5.5 L0 3 L-4.5 5.5 Z" fill={`rgb(var(--bs-${markInk}))`} stroke="rgb(var(--bs-bg))" strokeWidth="1" />
        </svg>
      </span>
      <span className="absolute left-3 bottom-2.5 text-[12px] italic text-bs-neutral-800 bg-bs-bg/80 px-1.5">
        {track.length > 1
          ? `Track ${utc(track[track.length - 1].time_utc)}–${utc(track[0].time_utc)} UTC`
          : expired
          ? 'Track no longer kept (positions are stored for 7 days)'
          : 'No positions around the detection time'}
        {atDetection ? ' · marker at detection' : ' · marker at last report'}
      </span>
      <button
        onClick={onOpenMap}
        className={`${btn} absolute right-3 bottom-3 border-bs-ink/[.16] bg-bs-bg hover:bg-bs-surface`}
      >
        <MapIcon size={16} />
        Open on map
      </button>
    </div>
  );
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { focusVessel } = useVesselContext();
  const [alerts, setAlerts] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selId, setSelId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  // Triage queue: everything still open or acknowledged.
  useEffect(() => {
    if (!token) return undefined;
    let stale = false;
    const load = () =>
      apiRequest('/api/alerts?status=open,acknowledged,escalated&sort=severity&limit=500', { token })
        .then((res) => {
          if (stale) return;
          setAlerts(res.rows);
          setLoadError(null);
        })
        .catch((err) => !stale && setLoadError(err.message || 'Failed to load alerts'));
    load();
    const timer = setInterval(load, 15000);
    return () => {
      stale = true;
      clearInterval(timer);
    };
  }, [token, refresh]);

  const queue = useMemo(() => {
    const types = FILTERS.find((f) => f.name === filter)?.types;
    // Already most severe first, then newest (sort=severity).
    return (alerts || []).filter((a) => !types || types.includes(a.type));
  }, [alerts, filter]);

  const sel = queue.find((a) => a.alert_id === selId) || queue[0] || null;
  const [caseId, caseMmsi, caseArea, caseAt] = [sel?.alert_id, sel?.mmsi, sel?.restricted_area_id, sel?.created_at];

  // Case file: AIS vessel, track around detection, alert history, timeline, restricted zone.
  useEffect(() => {
    if (!token || !caseId) return undefined;
    let stale = false;
    const get = (url) => apiRequest(url, { token });
    Promise.allSettled([
      caseMmsi ? get(`/api/ais/vessels?q=${caseMmsi}&limit=5`) : null,
      caseMmsi
        ? get(
            `/api/ais/positions/${caseMmsi}?limit=500` +
              `&from=${new Date(new Date(caseAt).getTime() - TRACK_BEFORE_MS).toISOString()}` +
              `&to=${new Date(new Date(caseAt).getTime() + TRACK_AFTER_MS).toISOString()}`
          )
        : null,
      caseMmsi ? get(`/api/alerts?mmsi=${caseMmsi}&limit=1`) : null,
      get(`/api/alerts/${caseId}/events`),
      caseArea ? get(`/api/restricted-areas/${caseArea}`) : null,
    ]).then(([vessel, track, history, events, area]) => {
      if (stale) return;
      const ok = (r) => (r.status === 'fulfilled' ? r.value : null);
      setDetail({
        id: caseId,
        vessel: (ok(vessel) || []).find((v) => String(v.mmsi) === String(caseMmsi)) || null,
        track: ok(track) || [],
        priorAlerts: ok(history)?.total != null ? Math.max(0, ok(history).total - 1) : null,
        events: ok(events) || [],
        trackExpired: Date.now() - new Date(caseAt).getTime() > POSITION_RETENTION_MS,
        area: ok(area)?.geometry ?? null,
      });
    });
    return () => {
      stale = true;
    };
  }, [token, caseId, caseMmsi, caseArea, caseAt, refresh]);

  const caseDetail = detail?.id === caseId ? detail : null;

  const act = async (path, body, patch, method = 'PUT') => {
    setBusy(true);
    setActionError(null);
    try {
      await apiRequest(`/api/alerts/${sel.alert_id}/${path}`, { token, method, body });
      setAlerts((prev) => prev.map((a) => (a.alert_id === sel.alert_id ? { ...a, ...patch } : a)));
      setRefresh((n) => n + 1);
    } catch (err) {
      const msg = err.message || 'Request failed';
      setActionError(/permission|forbidden|403/i.test(msg) ? "Your role can't change alerts (needs alert.status.view)." : msg);
    } finally {
      setBusy(false);
    }
  };

  const openOnMap = () => {
    const v = caseDetail?.vessel;
    if (v) focusVessel(toUiVessel(v), 10);
    navigate('/');
  };

  const openCount = (alerts || []).filter((a) => a.status === 'open').length;
  const unowned = (alerts || []).filter((a) => a.status === 'open' && a.assigned_to == null).length;
  const oldestOpen = (alerts || []).filter((a) => a.status === 'open').reduce((o, a) => (!o || a.created_at < o ? a.created_at : o), null);
  const mine = sel && user && sel.assigned_to === user.user_id;
  const status = sel ? statusOf(sel) : '';
  const v = caseDetail?.vessel;
  const shipType = v?.ship_type_name?.split(/[,:]/)[0];
  const flag = flagFromMmsi(sel?.mmsi);

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 text-bs-ink font-sans pt-3 px-4 pb-12 overflow-hidden">
      {/* Title + filters */}
      <div className="flex flex-wrap items-end gap-5">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">Alerts</h1>
          <div className="mt-0.5 text-[14px] italic">
            {alerts === null ? (
              loadError ? <span className="text-bs-accent-2-700">Couldn't load alerts ({loadError}). Retrying.</span> : <Skeleton className="h-4 w-72 mt-1" />
            ) : (
              <>
                {openCount} open · {unowned} without an owner
                {oldestOpen && ` · oldest raised ${ago(oldestOpen)}`}
              </>
            )}
          </div>
        </div>
        <div role="radiogroup" aria-label="Alert type" className="ml-auto inline-flex border border-bs-ink/[.16] rounded-sm overflow-hidden">
          {FILTERS.map((f) => (
            <button
              key={f.name}
              role="radio"
              aria-checked={filter === f.name}
              onClick={() => setFilter(f.name)}
              className={`px-3 py-1.5 text-[13px] border-l border-bs-ink/[.16] first:border-l-0 ${focusRing} focus-visible:-outline-offset-2 ${
                filter === f.name ? 'bg-bs-accent text-bs-bg' : 'hover:bg-bs-ink/[.07]'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-10 mt-7 flex-1 min-h-0">
        {/* Triage queue */}
        <div className="w-[350px] shrink-0 flex flex-col gap-0.5 overflow-y-auto pb-8" role="listbox" aria-label="Alert queue">
          {alerts === null &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3.5 px-4 py-3.5">
                <Skeleton className="w-1 self-stretch rounded-none" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          {alerts !== null && queue.length === 0 && (
            <p className="px-4 py-3.5 text-[14px] italic text-bs-neutral-700">
              No open {filter === 'All' ? '' : `${filter.toLowerCase()} `}alerts.
            </p>
          )}
          {queue.map((a) => {
            const on = a.alert_id === sel?.alert_id;
            const st = statusOf(a);
            return (
              <button
                key={a.alert_id}
                role="option"
                aria-selected={on}
                onClick={() => {
                  setSelId(a.alert_id);
                  setActionError(null);
                }}
                className={`flex gap-3.5 px-4 py-3.5 text-left ${focusRing} ${on ? 'bg-bs-surface' : 'hover:bg-bs-neutral-200'}`}
              >
                <span className={`w-1 shrink-0 self-stretch ${on ? 'bg-bs-accent' : ''}`} />
                <span className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-sm ${sevTag(a.severity)}`}>{sevLabel(a.severity)}</span>
                    <span className="text-[13px] italic">{TYPE_LABEL[a.type] || a.type}</span>
                    <span className="ml-auto text-[12px] font-mono text-bs-neutral-700 whitespace-nowrap">{ago(a.created_at)}</span>
                  </span>
                  <span className="font-semibold text-[16px] truncate">{a.vessel_name || 'Unknown vessel'}</span>
                  <span className="text-[13px] text-bs-neutral-800 line-clamp-2 [text-wrap:pretty]">{a.title}</span>
                  <span className={`text-[12px] font-semibold ${statusInk(st)}`}>{st}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Case file */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pb-8 pr-3">
          {!sel ? (
            alerts === null ? (
              <>
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-8 w-3/4 mt-3" />
                <Skeleton className="mt-[18px] w-full" style={{ aspectRatio: ASPECT }} />
              </>
            ) : (
              <p className="text-[15px] italic text-bs-neutral-700">Nothing to triage. New alerts appear here as they're raised.</p>
            )
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-[13px]">
                <span className={`text-[11px] px-2.5 py-0.5 rounded-sm ${sevTag(sel.severity)}`}>{sevLabel(sel.severity)} severity</span>
                <span className="italic">{TYPE_LABEL[sel.type] || sel.type}</span>
                <span className="text-bs-neutral-700">· Case SG-{String(sel.alert_id).padStart(4, '0')}</span>
                <span className={`ml-auto font-semibold ${statusInk(status)}`}>{status}</span>
              </div>
              <h2 className="mt-2.5 mb-2 text-[20px] font-semibold leading-[1.15] tracking-[-0.01em] [text-wrap:pretty]">{sel.title}</h2>
              <div className="flex flex-wrap gap-6 text-[13px]">
                <span>
                  <span className="text-bs-neutral-700">Detected</span>{' '}
                  <b className="font-mono font-medium">{utc(sel.created_at, true)} UTC</b>
                </span>
                <span>
                  <span className="text-bs-neutral-700">{sel.lat != null ? 'Position' : 'Last position'}</span>{' '}
                  <b className="font-mono font-medium">
                    {sel.lat != null
                      ? formatLatLon(Number(sel.lat), Number(sel.lon))
                      : v?.lat != null
                      ? formatLatLon(Number(v.lat), Number(v.lon))
                      : '—'}
                  </b>
                </span>
                <span>
                  <span className="text-bs-neutral-700">Assigned</span>{' '}
                  <b>{sel.assigned_to == null ? 'Unassigned' : sel.assignee_name || `User #${sel.assigned_to}`}</b>
                </span>
              </div>

              <ChartCrop alert={sel} detail={caseDetail} onOpenMap={openOnMap} />

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-10 mt-6">
                <div>
                  <div className={kicker}>What happened</div>
                  <div className="flex flex-col gap-2 mt-2.5">
                    {!caseDetail ? (
                      [0, 1, 2].map((i) => <Skeleton key={i} className="h-4" style={{ width: `${90 - i * 15}%` }} />)
                    ) : (
                      <>
                        {caseDetail.events.map((e) => (
                          <div key={e.id} className="flex gap-3.5 text-[14px]">
                            <span className="w-[76px] shrink-0 pt-0.5 font-mono text-[12px] text-bs-neutral-700">{utc(e.at)}</span>
                            <span
                              className={`${e.kind === 'raised' || e.kind === 'escalate' ? 'font-semibold' : ''} ${
                                e.kind === 'escalate' ? 'text-bs-accent-2-700' : ''
                              } [text-wrap:pretty]`}
                            >
                              {eventText(e)}
                            </span>
                          </div>
                        ))}
                        {caseDetail.events.length === 0 && (
                          <p className="text-[13px] italic text-bs-neutral-700">No events recorded for this alert.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className={kicker}>Vessel</div>
                  <div className="mt-2 font-semibold text-[17px]">{v?.ship_name || sel.vessel_name || 'Unknown vessel'}</div>
                  <div className="text-[12px] font-mono text-bs-neutral-700">
                    MMSI {sel.mmsi || '—'} · IMO {v?.imo || '—'}
                    {v?.callsign && ` · ${v.callsign}`}
                  </div>
                  {!caseDetail ? (
                    <Skeleton className="h-20 w-full mt-2.5" />
                  ) : (
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2.5 text-[14px]">
                      <span className="text-bs-neutral-700">Type</span>
                      <span>{[shipType, flag?.name].filter(Boolean).join(', ') || '—'}</span>
                      <span className="text-bs-neutral-700">Last report</span>
                      <span>
                        {v?.sog != null ? `${Number(v.sog).toFixed(1)} kn on ${Math.round(Number(v.cog ?? 0))}°, ${ago(v.time_utc)}` : '—'}
                      </span>
                      {v?.destination && (
                        <>
                          <span className="text-bs-neutral-700">Destination</span>
                          <span>{v.destination}</span>
                        </>
                      )}
                      <span className="text-bs-neutral-700">Status</span>
                      <span>{v?.nav_status != null ? NAV_STATUS[v.nav_status] || `Code ${v.nav_status}` : '—'}</span>
                      <span className="text-bs-neutral-700">History</span>
                      <span>
                        {caseDetail.priorAlerts == null
                          ? '—'
                          : caseDetail.priorAlerts === 0
                          ? 'First alert on record'
                          : `${caseDetail.priorAlerts} earlier alert${caseDetail.priorAlerts > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision bar */}
              <div className="mt-auto pt-5 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => act('assign', { assigned_to: user?.user_id }, { assigned_to: user?.user_id })}
                  disabled={busy || mine || !user?.user_id}
                  className={`${btn} border-bs-ink/[.16] hover:enabled:bg-bs-ink/[.07]`}
                >
                  <UserPlus size={16} />
                  {mine ? 'Assigned to you' : 'Assign to me'}
                </button>
                <button
                  onClick={() => act('status', { status: 'dismissed' }, { status: 'dismissed' })}
                  disabled={busy || sel.status === 'dismissed'}
                  className={`${btn} border-transparent text-bs-neutral-800 hover:enabled:bg-bs-ink/[.07]`}
                >
                  Dismiss as false positive
                </button>
                {actionError && <span role="alert" className="text-[13px] italic text-bs-accent-2-700">{actionError}</span>}
                <button
                  onClick={() => act('escalate', {}, { status: 'escalated' }, 'POST')}
                  disabled={busy || sel.status === 'escalated' || sel.status === 'dismissed'}
                  title="Mark for intercept and notify the admins"
                  className={`${btn} ml-auto border-bs-accent-2 text-bs-accent-2-700 hover:enabled:bg-bs-accent-2-100`}
                >
                  <Siren size={16} />
                  {sel.status === 'escalated' ? 'Escalated' : 'Escalate to intercept'}
                </button>
                <button
                  onClick={() => act('status', { status: 'acknowledged' }, { status: 'acknowledged' })}
                  disabled={busy || ['acknowledged', 'escalated', 'dismissed'].includes(sel.status)}
                  className={`${btn} border-transparent bg-bs-accent text-bs-bg hover:enabled:bg-bs-accent-600`}
                >
                  <Check size={16} />
                  {sel.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
