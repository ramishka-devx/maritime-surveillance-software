import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
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

export default function RestrictedAreasMapCanvas({
  zones = [],
  selectedZone = null,
  onSelectZone = () => {},
}) {
  const [mapInstance, setMapInstance] = useState(null);
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
        <MapCursorTracker onCursorCoordsChange={setCursorCoords} />
        <MapBoundsController selectedZone={selectedZone} allZones={zones} />

        {/* Render Real GeoJSON Restricted Areas */}
        {layers.zones &&
          zones.map((zone) => {
            if (!Array.isArray(zone.coordinates) || zone.coordinates.length < 3) {
              return null;
            }

            const isSelected = String(zone.id) === String(selectedZone?.id);
            const color = getZoneColor(zone.type);
            const positions = zone.coordinates.map((c) => [c.lat, c.lon]);

            return (
              <React.Fragment key={zone.id || zone.name}>
                {/* Polygon Boundary */}
                <Polygon
                  positions={positions}
                  eventHandlers={{
                    click: () => onSelectZone(zone),
                  }}
                  pathOptions={{
                    color: color,
                    weight: isSelected ? 3 : 1.5,
                    dashArray: isSelected ? '6, 6' : '4, 4',
                    fillColor: color,
                    fillOpacity: isSelected ? 0.25 : 0.12,
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
    </div>
  );
}
