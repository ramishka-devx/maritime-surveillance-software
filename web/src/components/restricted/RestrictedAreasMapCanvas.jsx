import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker assets in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/**
 * Returns color code based on restricted zone classification:
 * - Red (#ef4444) for military
 * - Amber (#f59e0b) for cable / anchorage
 * - Emerald (#10b981) for sanctuary / marine
 * - Cyan (#06b6d4) for port
 */
export function getZoneColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('milit') || t.includes('defense') || t.includes('navy')) {
    return '#ef4444';
  }
  if (t.includes('cable') || t.includes('anchor') || t.includes('pipe')) {
    return '#f59e0b';
  }
  if (
    t.includes('sanct') ||
    t.includes('marine') ||
    t.includes('protect') ||
    t.includes('nature') ||
    t.includes('mpa')
  ) {
    return '#10b981';
  }
  if (t.includes('port') || t.includes('harbor') || t.includes('harbour') || t.includes('terminal')) {
    return '#06b6d4';
  }
  return '#ef4444'; // Default to military/red for general restricted
}

/**
 * Controller to smoothly fit bounds when a zone is selected or loaded
 */
function MapBoundsController({ selectedZone, allZones }) {
  const map = useMap();
  const initialFitRef = useRef(false);

  // Fit to selected zone when selected
  useEffect(() => {
    if (
      selectedZone &&
      Array.isArray(selectedZone.coordinates) &&
      selectedZone.coordinates.length >= 3
    ) {
      const latLngs = selectedZone.coordinates.map((c) => [c.lat, c.lon]);
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        const timer = setTimeout(() => {
          map.invalidateSize();
          map.flyToBounds(bounds, {
            padding: [80, 80],
            maxZoom: 14,
            duration: 1.0,
          });
        }, 120);
        return () => clearTimeout(timer);
      }
    } else if (!initialFitRef.current && Array.isArray(allZones) && allZones.length > 0) {
      // Fit to all zones on first load
      const allCoords = [];
      allZones.forEach((z) => {
        if (Array.isArray(z.coordinates)) {
          z.coordinates.forEach((c) => allCoords.push([c.lat, c.lon]));
        }
      });
      if (allCoords.length >= 3) {
        const bounds = L.latLngBounds(allCoords);
        if (bounds.isValid()) {
          const timer = setTimeout(() => {
            map.invalidateSize();
            map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 11, duration: 1.0 });
          }, 150);
          initialFitRef.current = true;
          return () => clearTimeout(timer);
        }
      }
    }
  }, [selectedZone?.id, allZones, map]);

  return null;
}

/**
 * Tracks mouse movements over map to display HUD coordinates
 */
function MapCursorTracker({ onCursorCoordsChange }) {
  useMapEvents({
    mousemove(e) {
      if (onCursorCoordsChange) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const latDeg = Math.floor(Math.abs(lat));
        const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(2);
        const latDir = lat >= 0 ? 'N' : 'S';

        const lngDeg = Math.floor(Math.abs(lng));
        const lngMin = ((Math.abs(lng) - lngDeg) * 60).toFixed(2);
        const lngDir = lng >= 0 ? 'E' : 'W';

        onCursorCoordsChange(
          `${latDeg}°${latMin}'${latDir} ${String(lngDeg).padStart(3, '0')}°${lngMin}'${lngDir}`
        );
      }
    },
  });
  return null;
}

/**
 * Ensures Leaflet resizes correctly within dynamic flexbox layouts
 */
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

/**
 * Bridge component exposing map instance to external controls (zoom in/out/north)
 */
function MapInstanceBridge({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

function clusterZones(zones, map, zoom) {
  if (!map || zoom >= 10) return zones.map((zone) => ({ zones: [zone], centroid: zone.centroid }));
  const buckets = new Map();
  zones.filter((zone) => zone.centroid).forEach((zone) => {
    const point = map.project([zone.centroid.lat, zone.centroid.lon], zoom);
    const key = `${Math.floor(point.x / 42)}:${Math.floor(point.y / 42)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(zone);
  });
  return [...buckets.values()].map((members) => ({
    zones: members,
    centroid: members.length === 1 ? members[0].centroid : {
      lat: members.reduce((sum, zone) => sum + zone.centroid.lat, 0) / members.length,
      lon: members.reduce((sum, zone) => sum + zone.centroid.lon, 0) / members.length,
    },
  }));
}

function ZoomTracker({ onZoom }) {
  const map = useMap();
  useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

function DrawingHandler({ enabled, onPoint }) {
  useMapEvents({ click: (event) => { if (enabled) onPoint({ lat: event.latlng.lat, lon: event.latlng.lng }); } });
  return null;
}

export default function RestrictedAreasMapCanvas({
  zones = [],
  selectedZone = null,
  onSelectZone = () => {},
  onCreateZone = () => {},
}) {
  const [mapInstance, setMapInstance] = useState(null);
  const [zoom, setZoom] = useState(7);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState([]);
  const [draftName, setDraftName] = useState('New restricted area');
  const [draftType, setDraftType] = useState('military');
  const [draftExpiry, setDraftExpiry] = useState('');
  const hoverTimer = useRef(null);
  const [cursorCoords, setCursorCoords] = useState("06°55.80'N 079°51.60'E");
  const [activeBasemap, setActiveBasemap] = useState('dark'); // 'dark' | 'satellite'
  const [layers, setLayers] = useState({
    zones: true,
    anchors: true,
    labels: true,
  });

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  const handleResetNorth = () => {
    if (mapInstance) {
      if (selectedZone?.coordinates?.length >= 3) {
        const latLngs = selectedZone.coordinates.map((c) => [c.lat, c.lon]);
        mapInstance.fitBounds(L.latLngBounds(latLngs), { padding: [80, 80] });
      } else {
        mapInstance.setView([7.87, 80.2], 7);
      }
    }
  };

  // Basemap Tile configuration
  const tileConfig = useMemo(() => {
    if (activeBasemap === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; World Imagery',
        className: '',
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'dark-osm-tiles',
    };
  }, [activeBasemap]);

  return (
    <div className="relative flex-1 min-h-0 w-full h-full overflow-hidden bg-[#070e1c] select-none font-sans z-0">
      {/* Interactive Leaflet Map Container */}
      <MapContainer
        center={[7.87, 80.2]}
        zoom={7}
        zoomSnap={0.5}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', backgroundColor: '#070e1c', zIndex: 0 }}
      >
        <TileLayer
          key={`${activeBasemap}-${tileConfig.className}`}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          className={tileConfig.className}
          maxZoom={19}
        />

        {/* Bridges & Events */}
        <MapResizeHandler />
        <MapInstanceBridge onMapReady={setMapInstance} />
        <ZoomTracker onZoom={setZoom} />
        <DrawingHandler enabled={isDrawing} onPoint={(point) => setDraftCoordinates((prev) => [...prev, point])} />
        <MapCursorTracker onCursorCoordsChange={setCursorCoords} />
        <MapBoundsController selectedZone={selectedZone} allZones={zones} />
        {draftCoordinates.length > 1 && <Polyline positions={draftCoordinates.map(({ lat, lon }) => [lat, lon])} pathOptions={{ color: '#22d3ee', weight: 2, dashArray: '5, 5' }} />}
        {draftCoordinates.length > 2 && <Polygon positions={draftCoordinates.map(({ lat, lon }) => [lat, lon])} pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.12, weight: 1.5 }} />}

        {/* Render Real GeoJSON Restricted Areas */}
        {layers.zones && zoom < 10 && clusterZones(zones.filter((zone) => String(zone.id) !== String(selectedZone?.id)), mapInstance, zoom).map((cluster) => {
          const zone = cluster.zones[0];
          const count = cluster.zones.length;
          const color = getZoneColor(zone.type);
          const glyph = count > 1 ? count : zone.type?.toLowerCase().includes('sanct') ? '⌖' : '✚';
          const icon = L.divIcon({ className: `restricted-area-marker${count > 1 ? ' restricted-area-marker--cluster' : ''}`, html: `<span style="--zone-color:${color}"><span class="restricted-area-marker__glyph">${glyph}</span></span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
          return <Marker key={`zone-marker-${cluster.zones.map((item) => item.id).join('-')}`} position={[cluster.centroid.lat, cluster.centroid.lon]} icon={icon}
            eventHandlers={{ mouseover: () => { clearTimeout(hoverTimer.current); if (count === 1) setHoveredZoneId(String(zone.id)); }, mouseout: () => { hoverTimer.current = setTimeout(() => setHoveredZoneId(null), 120); }, click: () => { if (count > 1) mapInstance?.setView([cluster.centroid.lat, cluster.centroid.lon], Math.min(zoom + 2, 10), { animate: true }); else { setHoveredZoneId(String(zone.id)); onSelectZone(zone); } } }}>
            {layers.labels && count === 1 && <Tooltip direction="top" offset={[0, -12]}><div className="font-mono text-xs"><strong>{zone.name || `Zone #${zone.id}`}</strong><br />{zone.category || zone.type} · {zone.areaSqm ? `${(zone.areaSqm / 1e6).toFixed(2)} km²` : 'Area unavailable'}</div></Tooltip>}
          </Marker>;
        })}
        {layers.zones &&
          zones.map((zone) => {
            if (!Array.isArray(zone.coordinates) || zone.coordinates.length < 3) {
              return null;
            }

            const isSelected = String(zone.id) === String(selectedZone?.id);
            const isHovered = String(zone.id) === hoveredZoneId;
            if (zoom < 10 && !isSelected && !isHovered) return null;
            const color = getZoneColor(zone.type);
            const positions = zone.coordinates.map((c) => [c.lat, c.lon]);

            return (
              <React.Fragment key={zone.id || zone.name}>
                {/* Polygon Boundary */}
                <Polygon
                  positions={positions}
                  eventHandlers={{
                    click: () => onSelectZone(zone),
                    mouseover: () => { clearTimeout(hoverTimer.current); setHoveredZoneId(String(zone.id)); },
                    mouseout: () => { hoverTimer.current = setTimeout(() => setHoveredZoneId(null), 120); },
                  }}
                  pathOptions={{
                    color: color,
                    weight: isSelected ? 2 : 1.25,
                    dashArray: isSelected ? '4, 4' : null,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.15 : 0.12,
                    className: isSelected ? 'zone-selected-pulse' : 'zone-boundary',
                  }}
                >
                  {/* Hover Tooltip */}
                  {layers.labels && (
                    <Tooltip
                      sticky
                      direction="top"
                      className="custom-leaflet-tooltip"
                    >
                      <div className="font-mono text-xs px-1 py-0.5">
                        <div className="font-bold uppercase text-white tracking-wide">
                          {zone.name}
                        </div>
                        <div className="text-[10px] text-cyan-300">
                          {zone.category || zone.type} • {zone.coordinates.length} vertices
                        </div>
                      </div>
                    </Tooltip>
                  )}

                  {/* Click Popup with Details */}
                  <Popup className="custom-leaflet-popup">
                    <div className="font-mono text-xs text-on-surface p-1 min-w-[190px]">
                      <div className="font-bold text-sm text-cyan-400 uppercase border-b border-outline-variant/30 pb-1 mb-1">
                        {zone.name}
                      </div>
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <div>
                          <span className="text-outline">Type: </span>
                          <span className="font-bold text-white capitalize">
                            {zone.category || zone.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-outline">Vertices: </span>
                          <span className="text-white">{zone.coordinates.length} pts</span>
                        </div>
                        {zone.incursions !== undefined && (
                          <div>
                            <span className="text-outline">Breaches: </span>
                            <span
                              className={`font-bold ${
                                zone.incursions > 0 ? 'text-red-400' : 'text-emerald-400'
                              }`}
                            >
                              {zone.incursions} active
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Polygon>

                {/* Display Boundary Anchor Markers When Selected (capped/sampled to prevent DOM freeze) */}
                {isSelected &&
                  layers.anchors &&
                  (() => {
                    const coords = zone.coordinates || [];
                    const step = coords.length > 60 ? Math.ceil(coords.length / 60) : 1;
                    const sampled = coords.filter((_, idx) => idx % step === 0);
                    return sampled.map((coord, idx) => (
                      <CircleMarker
                        key={`anchor-${zone.id}-${idx * step}`}
                        center={[coord.lat, coord.lon]}
                        radius={4}
                        pathOptions={{
                          color: '#22d3ee',
                          fillColor: '#070e1c',
                          fillOpacity: 1,
                          weight: 1.5,
                        }}
                      >
                        <Tooltip direction="right" offset={[6, 0]}>
                          <span className="font-mono text-[10px] text-cyan-300">
                            P{idx * step + 1}: {coord.lat.toFixed(4)}°, {coord.lon.toFixed(4)}°
                          </span>
                        </Tooltip>
                      </CircleMarker>
                    ));
                  })()}
              </React.Fragment>
            );
          })}
      </MapContainer>

      {/* Floating Top-Left Controls: Zoom Widget & GIS Layer Chips */}
      <div className="absolute top-4 left-4 z-[800] flex items-center gap-2 pointer-events-auto font-sans">
        {/* Zoom & Orientation Widget */}
        <div className="flex flex-col bg-surface-container-low/95 border border-outline-variant/40 rounded shadow-lg backdrop-blur-md overflow-hidden w-8">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <div className="h-px bg-outline-variant/30" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <div className="h-px bg-outline-variant/30" />
          <button
            type="button"
            onClick={handleResetNorth}
            className="p-1.5 hover:bg-surface-container text-cyan-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Focus & Center Selected Area"
          >
            <span className="font-mono text-[10px] font-bold">N</span>
          </button>
        </div>
      </div>
      <div className="absolute top-4 right-4 z-[800] flex max-w-[min(90vw,360px)] flex-col gap-2 rounded border border-white/10 bg-[#0b1220]/95 p-2.5 font-mono text-xs text-white shadow-xl backdrop-blur">
        {!isDrawing ? <button type="button" onClick={() => { setDraftCoordinates([]); setIsDrawing(true); }} className="rounded border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-cyan-200 hover:bg-cyan-400/20">Draw restricted area</button> : <>
          <div>Click map to add polygon vertices ({draftCoordinates.length})</div>
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} aria-label="Zone name" className="rounded border border-white/10 bg-slate-900 px-2 py-1.5" />
          <select value={draftType} onChange={(e) => setDraftType(e.target.value)} aria-label="Zone class" className="rounded border border-white/10 bg-slate-900 px-2 py-1.5">
            <option value="military">Military Exclusion</option><option value="sanctuary">Marine Sanctuary</option><option value="port">Port Security</option><option value="cable">Cable Corridor</option><option value="restricted">Custom Exclusion</option>
          </select>
          <label className="flex items-center justify-between gap-2 text-slate-300">Expires <input type="datetime-local" value={draftExpiry} onChange={(e) => setDraftExpiry(e.target.value)} className="rounded border border-white/10 bg-slate-900 px-2 py-1" /></label>
          <div className="flex gap-2"><button type="button" onClick={() => setDraftCoordinates((prev) => prev.slice(0, -1))} disabled={!draftCoordinates.length} className="rounded bg-white/10 px-2 py-1.5 disabled:opacity-40">Undo</button><button type="button" onClick={() => { setIsDrawing(false); setDraftCoordinates([]); }} className="rounded bg-white/10 px-2 py-1.5">Cancel</button><button type="button" disabled={draftCoordinates.length < 3 || !draftName.trim()} onClick={async () => { await onCreateZone({ name: draftName.trim(), type: draftType, coordinates: draftCoordinates, expires_at: draftExpiry ? new Date(draftExpiry).toISOString() : null }); setIsDrawing(false); setDraftCoordinates([]); setDraftExpiry(''); }} className="rounded bg-cyan-400 px-3 py-1.5 font-bold text-slate-950 disabled:opacity-40">Save zone</button></div>
        </>}
      </div>
    </div>
  );
}
