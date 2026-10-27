import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const INK = {
  zone: '#d6006c', // accent-2: restricted areas
  zoneFill: '#fff1f4',
  zoneLabel: '#aa0b56',
  draft: '#0088b0', // accent: what's being drawn or imported
  draftFill: '#e9f8ff',
  paper: '#f3f2f2',
};
// Where the map opens when there are no areas yet (the busiest AIS sector so far).
const DEFAULT_VIEW = { center: [52.0, 4.2], zoom: 7 };

const toLatLngs = (coords) => coords.map((c) => [c.lat, c.lon]);

// Fit the map to the given polygons whenever the set changes (by key).
function FitBounds({ polygons, fitKey }) {
  const map = useMap();
  useEffect(() => {
    const pts = polygons.flat();
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the key changes
  }, [map, fitKey]);
  return null;
}

// Click-to-place drawing. Clicking the first vertex or double-clicking finishes.
function DrawLayer({ points, cursor, onAdd, onMove, onFinish }) {
  const map = useMap();
  useEffect(() => {
    map.doubleClickZoom.disable();
    const el = map.getContainer();
    el.style.cursor = 'crosshair';
    return () => {
      map.doubleClickZoom.enable();
      el.style.cursor = '';
    };
  }, [map]);
  useMapEvents({
    click: (e) => onAdd([e.latlng.lat, e.latlng.lng]),
    dblclick: () => onFinish(),
    mousemove: (e) => onMove([e.latlng.lat, e.latlng.lng]),
  });

  const preview = cursor ? [...points, cursor] : points;
  return (
    <>
      {preview.length >= 3 && (
        <Polygon
          positions={preview}
          pathOptions={{ color: INK.draft, weight: 1.5, dashArray: '6 4', fillColor: INK.draftFill, fillOpacity: 0.5 }}
          interactive={false}
        />
      )}
      {preview.length === 2 && (
        <Polyline positions={preview} pathOptions={{ color: INK.draft, weight: 1.5, dashArray: '6 4' }} interactive={false} />
      )}
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={p}
          radius={i === 0 ? 6 : 4}
          pathOptions={{
            color: INK.draft,
            weight: 1.5,
            fillColor: i === 0 ? INK.draft : INK.paper,
            fillOpacity: 1,
            bubblingMouseEvents: false,
          }}
          eventHandlers={i === 0 ? { click: () => onFinish() } : {}}
        >
          {i === 0 && points.length >= 3 && <Tooltip direction="top" offset={[0, -6]}>Click to close the area</Tooltip>}
        </CircleMarker>
      ))}
    </>
  );
}

/**
 * areas: saved restricted areas ({ id, name, coordinates })
 * drafts: imported, not-yet-saved polygons ({ key, name, coordinates })
 */
export default function AreaMap({ areas, selectedId, onSelect, drafts = [], drawing, onDrawAdd, onDrawMove, onDrawFinish, draw }) {
  const savedPolys = useMemo(() => areas.map((a) => toLatLngs(a.coordinates)), [areas]);
  const draftPolys = useMemo(() => drafts.map((d) => toLatLngs(d.coordinates)), [drafts]);
  const selected = areas.find((a) => a.id === selectedId);
  const focus = draftPolys.length ? draftPolys : selected ? [toLatLngs(selected.coordinates)] : savedPolys;
  const fitKey = draftPolys.length ? `drafts:${drafts.map((d) => d.key).join(',')}` : selected ? `area:${selected.id}` : `all:${areas.length}`;

  return (
    <MapContainer
      center={DEFAULT_VIEW.center}
      zoom={DEFAULT_VIEW.zoom}
      zoomControl={false}
      style={{ width: '100%', height: '100%', backgroundColor: INK.paper }}
    >
      {/* Same chart as the Map page's "ENC" layer (MapCanvas.jsx). */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <FitBounds polygons={focus} fitKey={fitKey} />

      {areas.map((a, i) => {
        const on = a.id === selectedId;
        return (
          <Polygon
            key={a.id}
            positions={savedPolys[i]}
            pathOptions={{
              color: INK.zone,
              weight: on ? 2.5 : 1.4,
              dashArray: on ? null : '6 4',
              fillColor: INK.zoneFill,
              fillOpacity: on ? 0.75 : 0.5,
            }}
            interactive={!drawing}
            eventHandlers={{ click: () => onSelect(a.id) }}
          >
            <Tooltip permanent direction="center" className="bs-zone-label">
              {a.name}
            </Tooltip>
          </Polygon>
        );
      })}

      {drafts.map((d, i) => (
        <Polygon
          key={d.key}
          positions={draftPolys[i]}
          pathOptions={{ color: INK.draft, weight: 1.5, dashArray: '6 4', fillColor: INK.draftFill, fillOpacity: 0.5 }}
          interactive={false}
        >
          <Tooltip permanent direction="center" className="bs-zone-label bs-zone-label-draft">
            {d.name}
          </Tooltip>
        </Polygon>
      ))}

      {drawing && <DrawLayer {...draw} onAdd={onDrawAdd} onMove={onDrawMove} onFinish={onDrawFinish} />}
    </MapContainer>
  );
}
