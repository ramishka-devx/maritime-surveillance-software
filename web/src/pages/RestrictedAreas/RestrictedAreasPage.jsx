import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PenLine, Upload, X } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { parseGeoJsonFile } from '../../lib/geoJsonParser.js';
import { useAuth } from '../../auth/AuthContext.jsx';

// Lazy-load the Leaflet map so it doesn't block the initial page render.
// Leaflet initialises a canvas + downloads tiles synchronously, which can
// freeze the tab for several seconds before the API response even arrives.
const AreaMap = React.lazy(() => import('../../components/restricted/AreaMap.jsx'));

// Area types. Geofence alerts are critical for military-style types (restricted-area.service.js
// checks for military/security/danger/defense/prohibited) and high for the rest.
const TYPES = [
  { id: 'military', label: 'Military / exclusion', critical: true },
  { id: 'restricted', label: 'Restricted' },
  { id: 'port', label: 'Port security' },
  { id: 'anchorage', label: 'Anchorage' },
  { id: 'sanctuary', label: 'Marine sanctuary' },
  { id: 'cable', label: 'Cable / pipeline corridor' },
];
const typeLabel = (t) => TYPES.find((x) => x.id === t)?.label || t || 'Restricted';
const isCritical = (t) => /military|security|danger|defen[cs]e|prohibited/i.test(t || '');

const INCURSION_DAYS = 7;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes – treat cache as fresh
const focusRing = 'outline-none focus-visible:outline-bs-accent';
const btn = `inline-flex items-center justify-center gap-1.5 px-[18px] py-2.5 rounded-sm border text-[13px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed ${focusRing}`;
const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const field = `w-full h-[38px] px-2.5 text-[13px] bg-bs-surface border border-bs-ink/[.16] rounded-sm hover:border-bs-ink/45 focus-visible:border-bs-accent ${focusRing} focus-visible:outline-offset-0`;

// Module-level cache — survives React re-mounts (navigation away and back).
// Areas are large (1.8 MB of geometry), so we keep a single copy here rather
// than re-parsing them every navigation.
const _areasCache = {
  areas: null,       // transformed area objects
  incursions: [],    // geofence alert rows
  fetchedAt: 0,      // Date.now() at last successful fetch
};

// Build a quick lookup map for deduplication: id → area
function mergeAreas(prev, incoming) {
  if (!prev) return incoming;
  const byId = new Map(prev.map((a) => [a.id, a]));
  for (const a of incoming) byId.set(a.id, a); // overwrite changed, add new
  return Array.from(byId.values());
}

// Polygon area on a local equirectangular projection; fine for areas up to a few hundred km.
function areaKm2(coords) {
  if (coords.length < 3) return 0;
  const lat0 = (coords.reduce((s, c) => s + c.lat, 0) / coords.length) * (Math.PI / 180);
  const pts = coords.map((c) => [c.lon * 111.32 * Math.cos(lat0), c.lat * 110.574]);
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}
const fmtArea = (km2) =>
  km2 >= 1 ? `${km2.toFixed(km2 < 10 ? 1 : 0)} km² · ${(km2 / 3.4299).toFixed(1)} NM²` : `${Math.round(km2 * 100)} ha`;

// GET /api/restricted-areas returns GeoJSON geometry as a string; keep the outer ring.
function toArea(row) {
  let geo = row.geometry;
  if (typeof geo === 'string') {
    try {
      geo = JSON.parse(geo);
    } catch {
      geo = null;
    }
  }
  const ring = geo?.type === 'Polygon' ? geo.coordinates[0] : geo?.type === 'MultiPolygon' ? geo.coordinates[0][0] : [];
  // GeoJSON rings repeat the first point at the end; drop it for display and counting.
  const coords = ring.map(([lon, lat]) => ({ lat: Number(lat), lon: Number(lon) }));
  if (coords.length > 1 && coords[0].lat === coords.at(-1).lat && coords[0].lon === coords.at(-1).lon) coords.pop();
  return { id: row.id, name: row.name || `Area #${row.id}`, type: row.type, coordinates: coords };
}

function ago(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} d ago`;
}

// Name + type for one or more polygons (a drawn area, or the polygons in a GeoJSON file).
function AreaDetailsModal({ drafts, onChange, onCancel, onSave, saving, error, source }) {
  const firstInput = useRef(null);
  useEffect(() => {
    firstInput.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !saving && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, saving]);

  const included = drafts.filter((d) => d.include);
  const valid = included.length > 0 && included.every((d) => d.name.trim() && d.type);

  // Portal to <body> so the backdrop also covers the app's sidebar and header.
  return createPortal(
    <div className="fixed inset-0 z-[1000] grid place-items-center p-5 bg-bs-neutral-800/50" onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="area-modal-title" className="w-[min(560px,100%)] max-h-[85vh] flex flex-col bg-bs-bg text-bs-ink shadow-bs-lg rounded-[4px]">
        <div className="px-6 pt-5 pb-3 flex items-start gap-3">
          <div className="flex-1">
            <h2 id="area-modal-title" className="text-[20px] font-semibold">
              {source === 'draw' ? 'New restricted area' : `Import ${drafts.length} area${drafts.length > 1 ? 's' : ''}`}
            </h2>
            <p className="text-[13px] italic text-bs-neutral-700">
              {source === 'draw'
                ? 'Name it and choose its type. Vessels entering it raise alerts within about 30 s.'
                : 'Check the names and types read from the file; untick any you don’t want.'}
            </p>
          </div>
          <button onClick={onCancel} disabled={saving} aria-label="Close" className={`w-8 h-8 grid place-items-center rounded-sm text-bs-neutral-700 hover:bg-bs-ink/[.07] ${focusRing}`}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2 overflow-y-auto flex flex-col gap-4">
          {drafts.map((d, i) => (
            <div key={d.key} className={`flex flex-col gap-2.5 ${drafts.length > 1 ? 'pb-4 border-b border-bs-ink/[.08] last:border-b-0' : ''}`}>
              {drafts.length > 1 && (
                <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={d.include} onChange={(e) => onChange(i, { include: e.target.checked })} className="h-4 w-4 accent-bs-accent" />
                  <span className="font-semibold">Area {i + 1}</span>
                  <span className="italic text-bs-neutral-700">
                    {d.coordinates.length} points · {fmtArea(areaKm2(d.coordinates))}
                  </span>
                </label>
              )}
              <div className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 ${d.include ? '' : 'opacity-45'}`}>
                <div>
                  <label htmlFor={`area-name-${i}`} className="block mb-[5px] text-[11px] text-bs-ink/70">Name</label>
                  <input
                    id={`area-name-${i}`}
                    ref={i === 0 ? firstInput : null}
                    value={d.name}
                    maxLength={255}
                    disabled={!d.include || saving}
                    onChange={(e) => onChange(i, { name: e.target.value })}
                    placeholder="e.g. Naval exercise area R-12"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor={`area-type-${i}`} className="block mb-[5px] text-[11px] text-bs-ink/70">Type</label>
                  <select
                    id={`area-type-${i}`}
                    value={d.type}
                    disabled={!d.include || saving}
                    onChange={(e) => onChange(i, { type: e.target.value })}
                    className={`${field} cursor-pointer`}
                  >
                    {!TYPES.some((t) => t.id === d.type) && d.type && <option value={d.type}>{d.type}</option>}
                    {TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {drafts.length === 1 && (
                <p className="text-[12px] text-bs-neutral-700">
                  {d.coordinates.length} points · {fmtArea(areaKm2(d.coordinates))} · entries raise{' '}
                  <b className={isCritical(d.type) ? 'text-bs-accent-2-700' : ''}>{isCritical(d.type) ? 'critical' : 'high'}</b> severity alerts
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 flex items-center gap-2.5 border-t border-bs-ink/[.08]">
          {error && <span role="alert" className="text-[13px] italic text-bs-accent-2-700 mr-auto">{error}</span>}
          <button onClick={onCancel} disabled={saving} className={`${btn} ml-auto border-bs-ink/[.16] hover:enabled:bg-bs-ink/[.07]`}>
            {source === 'draw' ? 'Discard' : 'Cancel'}
          </button>
          <button onClick={onSave} disabled={!valid || saving} className={`${btn} border-transparent bg-bs-accent text-bs-bg hover:enabled:bg-bs-accent-600`}>
            {saving ? 'Saving…' : included.length > 1 ? `Save ${included.length} areas` : 'Save area'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function RestrictedAreasPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Seed state from the module-level cache so the map renders immediately on
  // every navigation-back, even before the background refresh completes.
  const [areas, setAreas] = useState(() => _areasCache.areas);
  const [incursions, setIncursions] = useState(() => _areasCache.incursions);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  // true only while a background re-fetch is in-flight (doesn't blank the map)
  const [backgroundLoading, setBackgroundLoading] = useState(false);

  // Drawing: points placed so far, and the cursor for the rubber-band edge.
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [cursor, setCursor] = useState(null);

  // Polygons waiting for a name/type (drawn or imported), and the modal's state.
  const [drafts, setDrafts] = useState([]);
  const [draftSource, setDraftSource] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [notice, setNotice] = useState(null);
  const fileInput = useRef(null);

  // Areas + geofence alerts from the last week.
  // Strategy:
  //  - If the cache is fresh (< TTL) AND this is not an explicit refresh → show
  //    cached data immediately and skip the network call entirely.
  //  - Otherwise → apply cached data instantly (if any) while silently fetching
  //    in the background, then merge the result without clearing the map.
  useEffect(() => {
    if (!token) return undefined;
    let stale = false;
    const forceFetch = refresh > 0; // explicit save-triggered reload
    const cacheAge = Date.now() - _areasCache.fetchedAt;
    const cacheIsWarm = _areasCache.areas !== null && cacheAge < CACHE_TTL_MS;

    // If cache is warm and nothing forced a refresh, use it as-is.
    if (cacheIsWarm && !forceFetch) return undefined;

    setBackgroundLoading(true);
    const from = new Date(Date.now() - INCURSION_DAYS * 24 * 3600 * 1000).toISOString();
    Promise.all([
      apiRequest('/api/restricted-areas', { token }),
      apiRequest(`/api/alerts?type=geofence&from=${from}&limit=1000`, { token }).catch(() => ({ rows: [] })),
    ])
      .then(([rows, alerts]) => {
        if (stale) return;
        const fresh = (Array.isArray(rows) ? rows : rows?.rows || [])
          .map(toArea)
          .filter((a) => a.coordinates.length >= 3);
        const freshIncursions = alerts?.rows || [];

        // Merge into existing areas so the map never goes blank during refresh.
        setAreas((prev) => mergeAreas(prev, fresh));
        setIncursions(freshIncursions);
        setLoadError(null);
        setBackgroundLoading(false);

        // Update the module-level cache.
        _areasCache.areas = mergeAreas(_areasCache.areas, fresh);
        _areasCache.incursions = freshIncursions;
        _areasCache.fetchedAt = Date.now();
      })
      .catch((err) => {
        if (stale) return;
        // Only surface an error if we have nothing to show.
        if (!_areasCache.areas) setLoadError(err.message || 'Failed to load restricted areas');
        setBackgroundLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [token, refresh]);

  const incursionsOf = useCallback((id) => incursions.filter((a) => a.restricted_area_id === id), [incursions]);

  const startDrawing = () => {
    setDrafts([]);
    setPoints([]);
    setCursor(null);
    setNotice(null);
    setDrawing(true);
  };
  const cancelDrawing = useCallback(() => {
    setDrawing(false);
    setPoints([]);
    setCursor(null);
  }, []);
  const finishDrawing = useCallback(() => {
    // A double-click also fires two clicks; drop repeated points before closing.
    const pts = points.filter((p, i) => i === 0 || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 1e-6);
    if (pts.length < 3) {
      setNotice('An area needs at least 3 points.');
      return;
    }
    setDrawing(false);
    setCursor(null);
    setDraftSource('draw');
    setSaveError(null);
    setDrafts([{ key: 'drawn', name: '', type: 'restricted', include: true, coordinates: pts.map(([lat, lon]) => ({ lat, lon })) }]);
  }, [points]);

  // Keyboard while drawing: Enter finishes, Backspace removes the last point, Esc cancels.
  useEffect(() => {
    if (!drawing) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') cancelDrawing();
      else if (e.key === 'Enter') finishDrawing();
      else if (e.key === 'Backspace') {
        e.preventDefault();
        setPoints((p) => p.slice(0, -1));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawing, cancelDrawing, finishDrawing]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    cancelDrawing();
    setNotice(null);
    try {
      const { zones, errors } = await parseGeoJsonFile(file);
      if (errors.length) setNotice(`Skipped ${errors.length} feature(s): ${errors[0]}`);
      setDraftSource('file');
      setSaveError(null);
      setDrafts(
        zones.map((z, i) => ({
          key: `${file.name}-${i}`,
          name: z.name,
          type: z.type,
          include: true,
          // The parser keeps GeoJSON's closing point; the API closes rings itself.
          coordinates: z.coordinates.filter((c, j, all) => !(j === all.length - 1 && c.lat === all[0].lat && c.lon === all[0].lon)),
        }))
      );
    } catch (err) {
      setNotice(err.message || 'Could not read that GeoJSON file.');
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const failed = [];
    let saved = 0;
    for (const d of drafts.filter((x) => x.include)) {
      try {
        await apiRequest('/api/restricted-areas', {
          token,
          method: 'POST',
          body: { name: d.name.trim(), type: d.type, coordinates: d.coordinates },
        });
        saved += 1;
      } catch (err) {
        failed.push(`${d.name || 'Unnamed'}: ${err.message}`);
      }
    }
    setSaving(false);
    if (failed.length) {
      // Keep only the ones that failed so they can be fixed and retried.
      setDrafts((prev) => prev.filter((d) => d.include && failed.some((f) => f.startsWith(`${d.name || 'Unnamed'}:`))));
      setSaveError(`${saved ? `${saved} saved; ` : ''}${failed.length} failed. ${failed[0]}`);
    } else {
      setDrafts([]);
      setNotice(`${saved} area${saved === 1 ? '' : 's'} saved. Monitoring starts within 30 s.`);
    }
    if (saved) {
      _areasCache.fetchedAt = 0; // bust cache so refresh always fetches
      setRefresh((n) => n + 1);
    }
  };

  const selected = areas?.find((a) => a.id === selectedId) || null;
  const selectedIncursions = selected ? incursionsOf(selected.id) : [];

  return (
    <div className="w-full h-full flex bg-slate-100 text-bs-ink font-sans px-4">
      {/* Area list + detail */}
      <aside className="w-[360px] shrink-0 flex flex-col min-h-0 pr-6 pt-3">
        <div className="">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">Restricted Areas</h1>
          <p className="mt-0.5 text-[14px] italic">
            {areas === null ? (
              loadError ? <span className="text-bs-accent-2-700">{loadError}</span> : <Skeleton className="h-4 w-56 mt-1" />
            ) : (
              <span className="inline-flex items-center gap-2">
                {`${areas.length} area${areas.length === 1 ? '' : 's'} monitored · ${incursions.length} incursion${incursions.length === 1 ? '' : 's'} in ${INCURSION_DAYS} days`}
                {backgroundLoading && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-bs-neutral-600 not-italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-bs-accent animate-pulse" />
                    Refreshing
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        <div className="mt-5 flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5 pb-4" role="listbox" aria-label="Restricted areas">
          {/* Skeleton only on first-ever load when cache is empty */}
          {areas === null &&
            [0, 1, 2].map((i) => (
              <div key={i} className="px-4 py-3 flex flex-col gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          {areas?.length === 0 && (
            <p className="px-4 py-3 text-[14px] italic text-bs-neutral-700">
              No restricted areas yet. Draw one on the map or upload a GeoJSON file.
            </p>
          )}
          {areas?.map((a) => {
            const on = a.id === selectedId;
            const n = incursionsOf(a.id).length;
            return (
              <button
                key={a.id}
                role="option"
                aria-selected={on}
                onClick={() => setSelectedId(on ? null : a.id)}
                className={`flex gap-3 px-4 py-3 text-left ${focusRing} ${on ? 'bg-bs-surface' : 'hover:bg-bs-neutral-200'}`}
              >
                <span className={`w-1 shrink-0 self-stretch ${on ? 'bg-bs-accent' : ''}`} />
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="font-semibold text-[15px] truncate">{a.name}</span>
                  <span className="flex items-center gap-2 text-[12px] min-w-0">
                    <span className={`shrink-0 whitespace-nowrap px-2 py-px rounded-sm ${isCritical(a.type) ? 'bg-bs-accent-2-100 text-bs-accent-2-700' : 'bg-bs-neutral-100 text-bs-neutral-800'}`}>
                      {typeLabel(a.type)}
                    </span>
                    <span className="italic text-bs-neutral-700 truncate">{fmtArea(areaKm2(a.coordinates))}</span>
                  </span>
                </span>
                <span className={`text-[13px] tabular-nums self-center ${n ? 'font-semibold text-bs-accent-2-700' : 'text-bs-neutral-700'}`} title={`Incursions in the last ${INCURSION_DAYS} days`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected area */}
        {selected && (
          <section className="border-t border-bs-ink/[.16] pt-4 pb-5 pl-4">
            <div className={kicker}>Selected area</div>
            <div className="mt-1.5 font-semibold text-[17px]">{selected.name}</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2 text-[14px]">
              <span className="text-bs-neutral-700">Type</span>
              <span>{typeLabel(selected.type)}</span>
              <span className="text-bs-neutral-700">Size</span>
              <span>{fmtArea(areaKm2(selected.coordinates))}, {selected.coordinates.length} points</span>
              <span className="text-bs-neutral-700">Alerts</span>
              <span>{isCritical(selected.type) ? 'Critical' : 'High'} severity on entry</span>
            </div>
            <div className={`${kicker} mt-4`}>Incursions, last {INCURSION_DAYS} days</div>
            <div className="mt-1.5 flex flex-col gap-1 text-[13px]">
              {selectedIncursions.length === 0 && <span className="italic text-bs-neutral-700">None.</span>}
              {selectedIncursions.slice(0, 4).map((a) => (
                <div key={a.alert_id} className="flex gap-2">
                  <span className="flex-1 truncate font-semibold">{a.vessel_name || `MMSI ${a.mmsi}`}</span>
                  <span className="italic text-bs-neutral-700 whitespace-nowrap">{ago(a.created_at)}</span>
                </div>
              ))}
            </div>
            {selectedIncursions.length > 0 && (
              <button onClick={() => navigate('/Alerts')} className={`mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-bs-accent-700 hover:text-bs-accent-800 ${focusRing}`}>
                Open in Alerts
                <ArrowRight size={14} />
              </button>
            )}
          </section>
        )}
      </aside>

      {/* Map + tools */}
      <div className="relative flex-1 min-w-0">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Skeleton className="w-full h-full absolute inset-0" />
                <span className="relative z-10 text-[13px] italic text-slate-500 mt-8">Loading map…</span>
              </div>
            </div>
          }
        >
          <AreaMap
            areas={areas || []}
            selectedId={selectedId}
            onSelect={setSelectedId}
            drafts={drafts}
            drawing={drawing}
            draw={{ points, cursor }}
            onDrawAdd={(p) => setPoints((prev) => [...prev, p])}
            onDrawMove={setCursor}
            onDrawFinish={finishDrawing}
          />
        </Suspense>

        <div className="absolute left-5 top-5 z-[500] flex gap-2">
          {drawing ? (
            <>
              <button onClick={finishDrawing} disabled={points.length < 3} className={`${btn} border-transparent bg-bs-accent text-bs-bg shadow-bs-sm hover:enabled:bg-bs-accent-600`}>
                Finish area
              </button>
              <button onClick={() => setPoints((p) => p.slice(0, -1))} disabled={!points.length} className={`${btn} border-bs-ink/[.16] bg-bs-bg shadow-bs-sm hover:enabled:bg-bs-surface`}>
                Undo point
              </button>
              <button onClick={cancelDrawing} className={`${btn} border-bs-ink/[.16] bg-bs-bg shadow-bs-sm hover:enabled:bg-bs-surface`}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={startDrawing} disabled={drafts.length > 0} className={`${btn} border-transparent bg-bs-accent text-bs-bg shadow-bs-sm hover:enabled:bg-bs-accent-600`}>
                <PenLine size={16} />
                Draw area
              </button>
              <button onClick={() => fileInput.current?.click()} disabled={drafts.length > 0} className={`${btn} border-bs-ink/[.16] bg-bs-bg shadow-bs-sm hover:enabled:bg-bs-surface`}>
                <Upload size={16} />
                Upload GeoJSON
              </button>
              <input ref={fileInput} type="file" accept=".geojson,.json,application/geo+json,application/json" className="hidden" onChange={onFile} />
            </>
          )}
        </div>

        {(drawing || notice) && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[500] max-w-[80%] px-4 py-2.5 bg-bs-bg shadow-bs-lg text-[13px]" role="status">
            {drawing ? (
              <>
                <b>{points.length} point{points.length === 1 ? '' : 's'}.</b>{' '}
                <span className="italic">
                  Click the map to add corners; click the first point, double-click or press Enter to finish. Backspace removes the last point, Esc cancels.
                </span>
              </>
            ) : (
              <span className="flex items-center gap-3">
                <span className="italic">{notice}</span>
                <button onClick={() => setNotice(null)} aria-label="Dismiss" className={`text-bs-neutral-700 ${focusRing}`}>
                  <X size={15} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <AreaDetailsModal
          drafts={drafts}
          source={draftSource}
          saving={saving}
          error={saveError}
          onChange={(i, patch) => setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)))}
          onCancel={() => {
            setDrafts([]);
            setSaveError(null);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}
