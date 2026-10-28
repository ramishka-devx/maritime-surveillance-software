import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Bell, Download, Pentagon, Ship, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';
import { useDashboardData } from '../../hooks/useDashboardData';
import { searchVessels, toUiVessel } from '../../lib/vessels.js';
import { esriMapImage } from '../../lib/esriMap.js';
import Skeleton from '../../components/ui/Skeleton.jsx';

const ink = (name) => `rgb(var(--bs-${name}))`;

// Alert types from the API (alerts.type) in the design's vocabulary and colours.
const TYPES = {
  loitering: { label: 'Loitering', color: ink('neutral-700') },
  dark_vessel: { label: 'Dark activity', color: ink('accent-2') },
  speed: { label: 'Speed anomaly', color: ink('accent-2-300') },
  geofence: { label: 'Restricted area', color: ink('accent-700') },
  route_deviation: { label: 'Route deviation', color: ink('accent-300') },
  collision_risk: { label: 'Collision risk', color: ink('accent-800') },
  manual: { label: 'Manual report', color: ink('accent-400') },
};
const typeOf = (t) => TYPES[t] || { label: t || 'Other', color: ink('neutral-400') };

// Stacked bottom-up in this order reversed: low at the bottom, critical on top.
const BANDS = [
  { key: 'critical', label: 'Critical', color: ink('accent-2-700') },
  { key: 'high', label: 'High', color: ink('accent-2') },
  { key: 'medium', label: 'Medium', color: ink('neutral-700') },
  { key: 'low', label: 'Low', color: ink('accent-400') },
];
const alertTotal = (b) => b.critical + b.high + b.medium + b.low;

const RANGE_TEXT = {
  '24h': { note: 'Last 24 hours, hourly (UTC)', short: 'last 24 h', period: '24 h' },
  '7d': { note: 'Last 7 days, daily (UTC)', short: 'last 7 days', period: '7 days' },
  '30d': { note: 'Last 30 days, daily (UTC)', short: 'last 30 days', period: '30 days' },
};

// Buckets are UTC-aligned server-side, so they're labelled in UTC.
function barLabel(range, iso, i) {
  const d = new Date(iso);
  if (range === '24h') return i % 3 === 0 ? `${String(d.getUTCHours()).padStart(2, '0')}Z` : '';
  if (range === '7d') return d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  return i % 5 === 0 ? String(d.getUTCDate()) : '';
}

// { value, previous } -> "+20%", "no change", "up from 0"
function change({ value, previous }) {
  if (!previous) return value ? 'up from 0' : 'no change';
  const pct = Math.round(((value - previous) / previous) * 100);
  return pct === 0 ? 'no change' : `${pct > 0 ? '+' : ''}${pct}%`;
}

const EMPTY = {
  kpis: {
    open_alerts: 0,
    unassigned: 0,
    high: { value: 0, previous: 0 },
    critical: { value: 0, previous: 0 },
    anomalies: { value: 0, previous: 0 },
    incursions: { value: 0, previous: 0, top_zone: null },
    active_vessels: 0,
  },
  buckets: [],
  by_type: [],
  top_flagged: [],
  queue: { total: 0, rows: [] },
  sectors: [],
  density: null,
};

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const h4 = 'text-[19px] font-semibold tracking-[-0.01em]';
const aside = 'ml-auto text-[13px] italic text-bs-neutral-700';
const focusRing = 'outline-none focus-visible:outline-bs-accent';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function generateCsv({ kpis, by_type, top_flagged, queue, sectors }) {
  const rows = [
    ['KPI', 'Value', 'Previous period'],
    ['Open alerts', kpis.open_alerts],
    ['High & critical', kpis.high.value, kpis.high.previous],
    ['Critical', kpis.critical.value, kpis.critical.previous],
    ['Active vessels (last hour)', kpis.active_vessels],
    ['Anomalies', kpis.anomalies.value, kpis.anomalies.previous],
    ['Incursions', kpis.incursions.value, kpis.incursions.previous],
    [],
    ['Alert type', 'Count'],
    ...by_type.map((t) => [typeOf(t.type).label, t.count]),
    [],
    ['MMSI', 'Vessel', 'Alerts'],
    ...top_flagged.map((v) => [v.mmsi, v.vessel_name, v.count]),
    [],
    ['Alert ID', 'Title', 'Severity', 'Vessel', 'MMSI', 'Created at'],
    ...queue.rows.map((a) => [a.alert_id, a.title, a.severity, a.vessel_name, a.mmsi, a.created_at]),
    [],
    ['Sector', 'Vessels (last 24 h)'],
    ...sectors.map((s) => [s.name, s.vessels]),
  ];
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

function Sparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = 90 / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(28 - (v / max) * 24).toFixed(1)}`).join(' ');
  return (
    <svg width="90" height="30" viewBox="0 0 90 30" className="overflow-visible mb-1 shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Bar heights (%) for the chart placeholder: uneven so it reads as a chart, not a bar.
const SKELETON_BARS = [30, 45, 25, 60, 40, 70, 35, 50, 20, 55, 65, 40, 30, 75, 45, 35, 55, 25, 60, 40, 50, 30, 45, 35];
const range = (n) => Array.from({ length: n }, (_, i) => i);

const fmtDeg = (v, pos, neg) => `${Math.abs(v).toFixed(1)}°${v < 0 ? neg : pos}`;


export default function DashboardPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { focusVessel } = useVesselContext();
  const [timeRange, setTimeRange] = useState('24h');
  const [sectorId, setSectorId] = useState(null);

  const { data, error } = useDashboardData(timeRange, sectorId);
  // Skeletons only on first load; a range change keeps the old figures until the new ones land.
  const loading = !data;
  const d = data || EMPTY;
  const { kpis, buckets } = d;
  const text = RANGE_TEXT[timeRange];

  const handleExport = () => {
    const url = URL.createObjectURL(new Blob([generateCsv(d)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open a vessel on the map; if it has no live AIS position the map just opens.
  const openOnMap = async (mmsi) => {
    if (mmsi) {
      try {
        const rows = await searchVessels(token, String(mmsi));
        const hit = (rows || []).find((r) => String(r.mmsi) === String(mmsi) && r.lat != null && r.lon != null);
        if (hit) focusVessel(toUiVessel(hit), 9);
      } catch (err) {
        console.error('Vessel lookup failed:', err);
      }
    }
    navigate('/');
  };

  const vsPrevious = (k) => `${change(k)} vs previous ${text.period}`;
  const kpiCards = [
    {
      label: 'Open alerts',
      icon: Bell,
      value: kpis.open_alerts,
      note: `${kpis.unassigned} unassigned`,
      spark: buckets.map(alertTotal),
      stroke: ink('accent'),
    },
    {
      label: 'High severity',
      icon: TriangleAlert,
      value: kpis.high.value,
      note: `${kpis.critical.value} critical · ${change(kpis.high)}`,
      title: vsPrevious(kpis.high),
      alert: true,
      spark: buckets.map((b) => b.critical + b.high),
      stroke: ink('accent-2'),
    },
    {
      label: 'Active vessels',
      icon: Ship,
      value: kpis.active_vessels.toLocaleString(),
      note: 'Reporting in the last hour',
      accent: true,
      // null = before the 7-day position history
      spark: buckets.map((b) => b.active_vessels).filter((v) => v !== null),
      stroke: ink('accent'),
    },
    {
      label: 'Anomalies',
      icon: Activity,
      value: kpis.anomalies.value,
      note: vsPrevious(kpis.anomalies),
      spark: buckets.map((b) => b.anomalies),
      stroke: ink('neutral-600'),
    },
    {
      label: 'Incursions',
      icon: Pentagon,
      value: kpis.incursions.value,
      note: kpis.incursions.top_zone ? `Mostly ${kpis.incursions.top_zone}` : vsPrevious(kpis.incursions),
      title: vsPrevious(kpis.incursions),
      spark: buckets.map((b) => b.incursions),
      stroke: ink('neutral-600'),
    },
  ];

  const sevTotals = Object.fromEntries(BANDS.map(({ key }) => [key, buckets.reduce((s, b) => s + b[key], 0)]));
  const top = Math.ceil(Math.max(4, ...buckets.map(alertTotal)) / 4) * 4;
  const yTicks = [top, (top * 3) / 4, top / 2, top / 4, 0];
  const barGap = buckets.length > 24 ? 3 : 6;

  const typeTotal = d.by_type.reduce((s, t) => s + t.count, 0);
  const C = 2 * Math.PI * 70;
  const arc = (n) => (typeTotal ? (n / typeTotal) * C : 0);
  const donut = d.by_type.map((t, i) => {
    const before = d.by_type.slice(0, i).reduce((s, x) => s + x.count, 0);
    return {
      ...t,
      ...typeOf(t.type),
      dash: `${Math.max(0, arc(t.count) - 2).toFixed(1)} ${C.toFixed(1)}`,
      offset: (-arc(before)).toFixed(1),
    };
  });

  const maxFlagged = Math.max(1, ...d.top_flagged.map((v) => v.count));
  const heat = d.density;
  const heatMax = heat ? Math.max(1, ...heat.cells) : 1;
  const sectorTotal = Math.max(1, d.sectors.reduce((s, x) => s + x.vessels, 0));
  const todayUtc = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full h-full overflow-y-auto bg-bs-bg text-bs-ink font-sans pr-7 pb-12" aria-busy={loading}>
      {/* Title row */}
      <div className="flex flex-wrap items-end gap-4 mt-7">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.015em]">Dashboard</h1>
          {loading && error && (
            <p role="alert" className="mt-1 text-[13px] italic text-bs-accent-2-700">
              Couldn't load the dashboard ({error}). Retrying every 30 s.
            </p>
          )}
        </div>
        <div role="radiogroup" aria-label="Time range" className="ml-auto inline-flex border border-bs-ink/[.16] rounded-sm overflow-hidden">
          {Object.keys(RANGE_TEXT).map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={timeRange === r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-[7px] text-[13px] uppercase border-l border-bs-ink/[.16] first:border-l-0 ${focusRing} focus-visible:-outline-offset-2 ${
                timeRange === r ? 'bg-bs-accent text-bs-bg' : 'hover:bg-bs-ink/[.07]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className={`inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-sm border border-bs-ink/[.16] text-[13px] font-semibold hover:bg-bs-ink/[.07] ${focusRing}`}
        >
          <Download size={16} />
          Export report
        </button>
      </div>

      {/* Headline figures */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8 mt-10">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="flex flex-col gap-1.5 min-w-0">
              <div className={`flex items-center gap-2 ${kicker} ${k.alert ? 'text-bs-accent-2-700' : ''}`}>
                <Icon size={15} />
                {k.label}
              </div>
              {loading ? (
                <div className="flex items-end gap-3">
                  <Skeleton className="w-24 h-10" />
                  <Skeleton className="w-[90px] h-[30px] mb-1 opacity-60" />
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <span
                    className={`text-[40px] font-semibold leading-none tracking-[-0.02em] tabular-nums ${
                      k.alert ? 'text-bs-accent-2-700' : k.accent ? 'text-bs-accent-700' : ''
                    }`}
                  >
                    {k.value}
                  </span>
                  <Sparkline values={k.spark} color={k.stroke} />
                </div>
              )}
              {loading ? (
                <Skeleton className="w-32 h-3.5 mt-1" />
              ) : (
                <div className="text-[13px] italic text-bs-neutral-800 truncate" title={k.title}>
                  {k.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alert history + types */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-14 mt-14">
        <section>
          <div className="flex flex-wrap items-baseline gap-4">
            <h2 className={h4}>Alerts over time</h2>
            <div className="ml-auto flex gap-4 text-[13px]">
              {BANDS.map((band) => (
                <span key={band.key} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ background: band.color }} />
                  {band.label} <b className="tabular-nums">{loading ? '–' : sevTotals[band.key]}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="relative h-[200px] mt-6 pl-7 flex items-end" style={{ gap: barGap }}>
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((t) => (
                <div key={t} className="flex items-center gap-2 h-0">
                  <span className="w-5 text-right text-[11px] font-mono text-bs-neutral-700">{loading ? '' : t}</span>
                  <span className="flex-1 border-t border-bs-neutral-200" />
                </div>
              ))}
            </div>
            {loading && SKELETON_BARS.map((h, i) => <Skeleton key={i} className="flex-1 rounded-none" style={{ height: `${h}%` }} />)}
            {buckets.map((b) => (
              <div
                key={b.start}
                title={`${new Date(b.start).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: timeRange === '24h' ? 'short' : undefined,
                  timeZone: 'UTC',
                })} UTC: ${alertTotal(b)} alerts`}
                className="relative flex-1 flex flex-col-reverse"
                style={{ height: (alertTotal(b) / top) * 200 }}
              >
                {BANDS.slice().reverse().map((band) => (
                  <span key={band.key} style={{ height: (b[band.key] / top) * 200, background: band.color }} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex pl-7 mt-2" style={{ gap: barGap }}>
            {buckets.map((b, i) => (
              <span key={b.start} className="flex-1 text-center text-[11px] font-mono text-bs-neutral-700">
                {barLabel(timeRange, b.start, i)}
              </span>
            ))}
          </div>
          <div className="flex justify-between mt-3.5 text-[13px] italic text-bs-neutral-700">
            <span>{text.note}</span>
            <span>Auto-refresh every 30 s</span>
          </div>
        </section>

        <section>
          <div className="flex items-baseline">
            <h2 className={h4}>Alerts by type</h2>
            {!loading && <span className={aside}>n = {typeTotal}, {text.short}</span>}
          </div>
          <div className="flex items-center gap-7 mt-6">
            <div className="relative w-[170px] h-[170px] shrink-0">
              <svg
                width="170" height="170" viewBox="0 0 170 170" aria-hidden="true"
                className={`-rotate-90 ${loading ? 'animate-pulse motion-reduce:animate-none' : ''}`}
              >
                <circle cx="85" cy="85" r="70" fill="none" stroke={ink('neutral-200')} strokeWidth="18" />
                {donut.map((s) => (
                  <circle
                    key={s.type}
                    cx="85" cy="85" r="70" fill="none"
                    stroke={s.color} strokeWidth="18" strokeDasharray={s.dash} strokeDashoffset={s.offset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  {loading ? (
                    <Skeleton className="w-12 h-8 mx-auto" />
                  ) : (
                    <div className="text-[34px] font-semibold leading-none tabular-nums">{typeTotal}</div>
                  )}
                  <div className="text-[12px] italic text-bs-neutral-700">incidents</div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2 text-[14px] min-w-0">
              {loading &&
                range(4).map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-2.5 h-2.5" />
                    <Skeleton className="h-3.5 flex-1" style={{ maxWidth: `${80 - i * 12}%` }} />
                  </div>
                ))}
              {!loading && donut.length === 0 && <span className="italic text-bs-neutral-700">No alerts in this range.</span>}
              {donut.map((s) => (
                <div key={s.type} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 shrink-0" style={{ background: s.color }} />
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Flagged vessels, queue, density */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,1fr)] gap-12 mt-16">
        <section>
          <div className="flex items-baseline">
            <h2 className={h4}>Top flagged vessels</h2>
            <span className={aside}>{text.short}</span>
          </div>
          <div className="flex flex-col gap-3.5 mt-5">
            {loading &&
              range(5).map((i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-4" style={{ width: `${85 - i * 8}%` }} />
                  <Skeleton className="h-1 ml-[22px]" />
                </div>
              ))}
            {!loading && d.top_flagged.length === 0 && (
              <span className="italic text-[14px] text-bs-neutral-700">No flagged vessels in this range.</span>
            )}
            {d.top_flagged.map((v, i) => (
              <button
                key={v.mmsi || v.vessel_name}
                onClick={() => openOnMap(v.mmsi)}
                className={`group flex flex-col gap-1.5 text-left ${focusRing}`}
              >
                <div className="flex items-baseline gap-2 w-full">
                  <span className="w-3.5 text-[12px] font-mono text-bs-neutral-700">{i + 1}</span>
                  <span className="flex-1 font-semibold text-[15px] truncate group-hover:text-bs-accent-700">{v.vessel_name}</span>
                  <span className="text-[13px] tabular-nums">{v.count} alerts</span>
                </div>
                <div className="ml-[22px] h-1 bg-bs-neutral-200 self-stretch">
                  <div className="h-1 bg-bs-accent-2" style={{ width: `${(v.count / maxFlagged) * 100}%` }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-2.5">
            <h2 className={h4}>Live interdiction queue</h2>
            {!loading && (
              <span className="ml-auto text-[11px] px-2.5 py-0.5 rounded-sm bg-bs-accent-2-100 text-bs-accent-2-700">
                {kpis.open_alerts} actionable
              </span>
            )}
          </div>
          <table className="w-full mt-3.5 text-[14px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] tracking-[0.08em] uppercase text-bs-ink/60">
                <th className="font-normal py-2.5 pr-2.5 border-b border-bs-ink/[.16]">UTC</th>
                <th className="font-normal py-2.5 px-2.5 border-b border-bs-ink/[.16]">Vessel</th>
                <th className="font-normal py-2.5 px-2.5 border-b border-bs-ink/[.16]">Incident</th>
                <th className="py-2.5 border-b border-bs-ink/[.16]" />
              </tr>
            </thead>
            <tbody>
              {loading &&
                range(4).map((i) => (
                  <tr key={i} className="border-b border-bs-ink/[.08]">
                    <td className="py-[11px] pr-2.5 align-top"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-[11px] px-2.5 align-top">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20 mt-1.5" />
                    </td>
                    <td className="py-[11px] px-2.5 align-top"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-[11px] align-top"><Skeleton className="h-4 w-10 ml-auto" /></td>
                  </tr>
                ))}
              {!loading && d.queue.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 italic text-bs-neutral-700">No open alerts.</td>
                </tr>
              )}
              {d.queue.rows.map((a) => {
                const iso = a.created_at ? new Date(a.created_at).toISOString() : '';
                const urgent = a.severity === 'critical' || a.severity === 'high';
                return (
                  <tr key={a.alert_id} className="border-b border-bs-ink/[.08] hover:bg-bs-ink/[.04]">
                    <td className="py-[11px] pr-2.5 font-mono text-[13px] whitespace-nowrap align-top">
                      {iso.slice(11, 19)}
                      {iso && iso.slice(0, 10) !== todayUtc && (
                        <div className="text-[11px] text-bs-neutral-700">
                          {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                        </div>
                      )}
                    </td>
                    <td className="py-[11px] px-2.5 align-top">
                      <div className="font-semibold">{a.vessel_name || 'Unknown vessel'}</div>
                      <div className="text-[12px] font-mono text-bs-neutral-700">{a.mmsi || '—'}</div>
                    </td>
                    <td className="py-[11px] px-2.5 align-top">
                      <span
                        title={a.title}
                        className={`inline-block text-[11px] px-2.5 py-0.5 rounded-sm ${
                          urgent ? 'bg-bs-accent-2-100 text-bs-accent-2-700' : 'bg-bs-neutral-100 text-bs-neutral-800'
                        }`}
                      >
                        {typeOf(a.type).label}
                      </span>
                    </td>
                    <td className="py-[11px] text-right align-top">
                      <button
                        onClick={() => openOnMap(a.mmsi)}
                        className={`px-1.5 py-1 rounded-sm text-[13px] font-semibold text-bs-accent hover:bg-bs-accent/10 ${focusRing}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-3.5 text-[13px]">
            <span className="italic text-bs-neutral-700">Open alerts, newest first</span>
            <button
              onClick={() => navigate('/Alerts')}
              className={`ml-auto inline-flex items-center gap-1 font-semibold text-bs-accent-700 hover:text-bs-accent-800 ${focusRing}`}
            >
              Full queue
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-3">
            <h2 className={`${h4} whitespace-nowrap`}>Traffic density</h2>
            {d.sectors.length > 0 && (
              <select
                aria-label="Sector"
                value={heat?.sector_id ?? ''}
                onChange={(e) => setSectorId(Number(e.target.value))}
                className={`ml-auto min-w-0 max-w-[60%] truncate bg-transparent text-[13px] italic text-bs-neutral-700 cursor-pointer ${focusRing}`}
              >
                {d.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {heat ? (
            <>
              {/* Basemap of the sector under the cell grid. Both are linear in lat/lon over the
                  same box, so the stretched image lines up with the cells. */}
              <div
                className="relative mt-5 w-full border border-bs-ink/[.16] overflow-hidden"
                style={{ aspectRatio: `${heat.cols} / ${heat.rows}` }}
              >
                <img src={esriMapImage('World_Light_Gray_Base', heat.bounds)} alt="" className="absolute inset-0 w-full h-full" />
                <img src={esriMapImage('World_Light_Gray_Reference', heat.bounds)} alt="" className="absolute inset-0 w-full h-full opacity-70" />
                <div className="absolute inset-0 grid gap-px" style={{ gridTemplateColumns: `repeat(${heat.cols}, minmax(0, 1fr))` }}>
                  {heat.cells.map((c, i) => (
                    <span
                      key={i}
                      title={c ? `${c.toLocaleString()} vessels` : undefined}
                      style={{ background: c ? ink('accent') : 'transparent', opacity: 0.15 + 0.7 * Math.sqrt(c / heatMax) }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2.5 flex justify-between text-[11px] font-mono text-bs-neutral-700">
                <span>
                  {fmtDeg(heat.bounds.w, 'E', 'W')} – {fmtDeg(heat.bounds.e, 'E', 'W')}
                </span>
                <span>
                  {fmtDeg(heat.bounds.s, 'N', 'S')} – {fmtDeg(heat.bounds.n, 'N', 'S')}
                </span>
              </div>
            </>
          ) : loading ? (
            <Skeleton className="mt-5 w-full aspect-[3/2]" />
          ) : (
            <p className="mt-5 italic text-[14px] text-bs-neutral-700">No sectors defined.</p>
          )}
          <div className="flex flex-col gap-2.5 mt-4">
            {loading &&
              range(2).map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-3.5" style={{ width: `${70 - i * 25}%` }} />
                  <Skeleton className="h-1" />
                </div>
              ))}
            {d.sectors.map((s) => (
              <div key={s.id} className="flex flex-col gap-1">
                <div className="flex text-[13px]">
                  <span className={`flex-1 truncate ${s.id === heat?.sector_id ? 'font-semibold' : ''}`}>{s.name}</span>
                  <span className="tabular-nums">
                    <b>{Math.round((s.vessels / sectorTotal) * 100)}%</b> · {s.vessels.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 bg-bs-neutral-200">
                  <div className="h-1 bg-bs-accent" style={{ width: `${(s.vessels / sectorTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          {d.sectors.length > 0 && (
            <p className="mt-3 text-[13px] italic text-bs-neutral-700">
              Vessels reporting in the last {heat?.hours ?? 24} h; darker squares hold more
              {heat ? ` (busiest: ${heatMax.toLocaleString()})` : ''}. Basemap © Esri.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
