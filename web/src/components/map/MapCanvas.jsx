import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  createVesselCanvas,
  getVesselCategory,
  getVesselThreat,
  isAlertVessel,
  syncVessels,
  vesselColor,
  vesselHeading,
} from './vesselCanvasLayer.js';
import { formatLatLon } from '../../lib/coords.js';

// Fix for default Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * The selected vessel: the design's arrowhead in a cyan ring (magenta if alerted), with its name.
 */
function createVesselMarkerIcon(vessel, isSelected = false) {
  const heading = vesselHeading(vessel);
  const alert = isAlertVessel(vessel);
  const fill = alert ? vesselColor(vessel) : isSelected ? '#0088b0' : vesselColor(vessel);
  const labelInk = alert ? '#aa0b56' : '#004961';

  const html = `
    <div style="position:relative;width:36px;height:36px;display:grid;place-items:center">
      ${isSelected ? '<span style="position:absolute;inset:0;border:1.5px solid #0088b0;border-radius:50%;background:rgb(0 136 176 / 0.12)"></span>' : ''}
      ${alert ? `<span style="position:absolute;inset:4px;border:1.5px dashed ${fill}"></span>` : ''}
      <svg width="16" height="16" viewBox="0 0 16 16" style="transform:rotate(${heading}deg);overflow:visible">
        <path d="M8 1 L13.5 14.5 L8 11.2 L2.5 14.5 Z" fill="${fill}" stroke="#f3f2f2" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
      <span style="position:absolute;left:40px;top:10px;white-space:nowrap;font:italic 600 12px Inter,system-ui,sans-serif;color:${labelInk};text-shadow:0 0 3px #f3f2f2,0 0 3px #f3f2f2">${escapeHtml(vessel.name || vessel.mmsi || '')}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vessel-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// Only the selected vessel is a DOM marker (for its animated ring); the rest are on the canvas
// layer. react-leaflet calls marker.setIcon() — rebuilding the DOM and restarting the ring
// animation — whenever the icon prop changes identity, so icons are cached by their visual
// inputs. Cleared when it grows, since the key includes the vessel name.
const iconCache = new Map();
function getVesselMarkerIcon(vessel, isSelected) {
  const heading = Math.round(vesselHeading(vessel));
  const key = `${vessel.threatLevel}|${vessel.status}|${heading}|${isSelected}|${vessel.name}`;
  let icon = iconCache.get(key);
  if (!icon) {
    if (iconCache.size > 500) iconCache.clear();
    icon = createVesselMarkerIcon({ ...vessel, heading }, isSelected);
    iconCache.set(key, icon);
  }
  return icon;
}

// Draws vessels on one canvas (see vesselCanvasLayer.js) and keeps it in sync with `vessels`.
function VesselCanvasLayer({ vessels, onSelect }) {
  const map = useMap();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = createVesselCanvas(map);
    canvasRef.current = canvas;
    return () => {
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (canvasRef.current) syncVessels(canvasRef.current, vessels, onSelect);
  }, [vessels, onSelect]);

  return null;
}

// Memoised so a MapCanvas re-render doesn't touch the marker unless its vessel changed.
const VesselMarker = memo(function VesselMarker({ vessel, isSelected, onSelect }) {
  // Handlers keyed only on onSelect: each poll brings new vessel objects, and a new
  // eventHandlers object makes react-leaflet unbind/rebind the marker's listeners.
  const vesselRef = useRef(vessel);
  useEffect(() => {
    vesselRef.current = vessel;
  });
  const eventHandlers = useMemo(() => ({ click: () => onSelect(vesselRef.current) }), [onSelect]);
  return (
    <Marker
      position={vessel.position}
      icon={getVesselMarkerIcon(vessel, isSelected)}
      eventHandlers={eventHandlers}
    />
  );
});

// Map Controller Component to listen for events & center changes
// Padded viewport as the API's bbox string ("minLon,minLat,maxLon,maxLat"). The padding
// keeps vessels just off-screen loaded so short pans don't show empty edges.
// Rounded outward to 0.01° (stable strings, fewer refetches); plain rounding could shrink a
// zoomed-in box (~0.01° wide) past the vessels on screen, so they vanished.
function viewportBbox(map) {
  const b = map.getBounds().pad(0.25);
  const down = (n) => (Math.floor(n * 100) / 100).toFixed(2);
  const up = (n) => (Math.ceil(n * 100) / 100).toFixed(2);
  return [down(b.getWest()), down(b.getSouth()), up(b.getEast()), up(b.getNorth())].join(',');
}

function MapEventsHandler({ onCursorCoordsChange, onMapReady, onViewportChange }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Report the viewport now and clear it on unmount, so other pages go back to the global list.
  useEffect(() => {
    if (!onViewportChange) return undefined;
    onViewportChange(viewportBbox(map));
    return () => onViewportChange(null);
  }, [map, onViewportChange]);

  useMapEvents({
    moveend() {
      onViewportChange?.(viewportBbox(map));
    },
    mousemove(e) {
      onCursorCoordsChange?.(formatLatLon(e.latlng.lat, e.latlng.lng));
    },
  });
  return null;
}

// Map Controller Component to smoothly focus and fly to selected vessel
// Selected vessel's recorded track: solid segments, dashed where reports stopped for a while,
// and a start dot. Fits the map to it once per track.
function VesselTrack({ segments }) {
  const map = useMap();
  useEffect(() => {
    const all = segments.flat();
    if (all.length > 1) map.fitBounds(all, { padding: [60, 60], maxZoom: 13 });
  }, [segments, map]);

  const start = segments[0]?.[0];
  return (
    <>
      {segments.slice(1).map((seg, i) => (
        <Polyline
          key={`gap-${i}`}
          positions={[segments[i][segments[i].length - 1], seg[0]]}
          pathOptions={{ color: '#006786', weight: 1.5, dashArray: '4, 6', opacity: 0.7 }}
        />
      ))}
      {segments.map((seg, i) => (
        <Polyline key={`seg-${i}`} positions={seg} pathOptions={{ color: '#0088b0', weight: 2.5, opacity: 0.9 }} />
      ))}
      {start && (
        <CircleMarker center={start} radius={4} pathOptions={{ color: '#006786', fillColor: '#f3f2f2', fillOpacity: 1, weight: 2 }}>
          <Tooltip direction="top">Track start</Tooltip>
        </CircleMarker>
      )}
    </>
  );
}

function MapFocusController({ focusTarget }) {
  const map = useMap();
  useEffect(() => {
    if (focusTarget && focusTarget.lat && focusTarget.lon) {
      map.flyTo([focusTarget.lat, focusTarget.lon], focusTarget.zoom || 9, {
        duration: 1.5,
      });
    }
  }, [focusTarget, map]);
  return null;
}

const NO_VESSELS = [];

export default memo(MapCanvas);

function MapCanvas({
  selectedVesselId = null,
  onSelectVessel,
  activeLayer = 'vector',
  onCursorCoordsChange,
  onMapReady,
  onViewportChange,
  focusTarget = null,
  filters = null,
  onFleetUpdate = null,
  track = null,
  vessels: propVessels = null,
}) {
  const mapRef = useRef(null);

  // Live vessels come from VesselContext (passed in by MapPage), which already polls the API
  // and merges in the reference fleet; polling here too doubled the requests and re-renders.
  const allVessels = propVessels || NO_VESSELS;

  // Stable click handler so memoised markers don't re-render when the parent passes a new
  // inline onSelectVessel each render.
  const onSelectRef = useRef(onSelectVessel);
  useEffect(() => {
    onSelectRef.current = onSelectVessel;
  });
  const handleSelect = useCallback((vessel) => onSelectRef.current?.(vessel), []);

  // Apply filters to fleet
  const filteredVessels = useMemo(() => {
    if (!filters) return allVessels;
    const { types = [], threats = [], minSpeed = 0, maxSpeed = 35 } = filters;

    return allVessels.filter((vessel) => {
      // 1. Vessel Type Category
      const cat = getVesselCategory(vessel);
      if (types.length > 0 && !types.includes(cat)) {
        return false;
      }

      // 2. Threat Classification
      const threat = getVesselThreat(vessel);
      if (threats.length > 0 && !threats.includes(threat)) {
        return false;
      }

      // 3. SOG Speed Filter
      const spd =
        typeof vessel.speed === 'number'
          ? vessel.speed
          : parseFloat(vessel.speed || vessel.sog || 0) || 0;

      if (spd < minSpeed || spd > maxSpeed) {
        return false;
      }

      return true;
    });
  }, [allVessels, filters]);

  // Always keep currently selected target pinned so operator doesn't lose sight
  const displayVessels = useMemo(() => {
    if (!selectedVesselId) return filteredVessels;
    const isSelectedIncluded = filteredVessels.some(
      (v) => String(v.mmsi) === String(selectedVesselId)
    );
    if (!isSelectedIncluded) {
      const selectedObj = allVessels.find(
        (v) => String(v.mmsi) === String(selectedVesselId)
      );
      if (selectedObj) {
        return [...filteredVessels, selectedObj];
      }
    }
    return filteredVessels;
  }, [filteredVessels, selectedVesselId, allVessels]);

  // The selected vessel is drawn as a DOM marker (animated ring, on top); the rest go to canvas.
  const selectedVessel = useMemo(
    () =>
      selectedVesselId
        ? displayVessels.find((v) => String(v.mmsi) === String(selectedVesselId)) || null
        : null,
    [displayVessels, selectedVesselId]
  );
  const canvasVessels = useMemo(
    () => (selectedVessel ? displayVessels.filter((v) => v !== selectedVessel) : displayVessels),
    [displayVessels, selectedVessel]
  );

  // Keep parent synchronized with fleet stats
  useEffect(() => {
    if (onFleetUpdate) {
      onFleetUpdate({
        totalCount: allVessels.length,
        filteredCount: filteredVessels.length,
        allVessels,
      });
    }
  }, [allVessels, filteredVessels, onFleetUpdate]);

  // Tile layer configuration (No API keys required)
  const tileConfig = useMemo(() => {
    if (activeLayer === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; World Imagery',
        className: '',
      };
    }
    if (activeLayer === 'enc') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: '',
      };
    }
    // Default: Esri Light Gray Canvas, a quiet chart that sits on the Broadsheet paper
    // (no API key), with its place-name layer on top.
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      labelsUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      className: '',
    };
  }, [activeLayer]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" id="map-viewport">
      <MapContainer
        center={[52.59, 6.158]}
        zoom={7}
        zoomSnap={0.5}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', backgroundColor: '#f3f2f2' }}
        ref={mapRef}
      >
        {/* Dynamic Basemap Layer */}
        <TileLayer
          key={`${activeLayer}-${tileConfig.className}`}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          className={tileConfig.className}
          maxZoom={19}
        />
        {tileConfig.labelsUrl && <TileLayer key="labels" url={tileConfig.labelsUrl} maxZoom={19} />}

        {/* Global Mouse Tracker for HUD Reticle & Map Instance Bridge */}
        <MapEventsHandler
          onCursorCoordsChange={onCursorCoordsChange}
          onMapReady={onMapReady}
          onViewportChange={onViewportChange}
        />

        {/* Global Smooth Focus Controller */}
        <MapFocusController focusTarget={focusTarget} />

        {track?.length > 0 && <VesselTrack segments={track} />}

        {/* Real-time Fleet Vessel Markers (Filtered with Selected Pinning) */}
        <VesselCanvasLayer vessels={canvasVessels} onSelect={handleSelect} />
        {selectedVessel && (
          <VesselMarker
            key={selectedVessel.mmsi}
            vessel={selectedVessel}
            isSelected
            onSelect={handleSelect}
          />
        )}
      </MapContainer>
    </div>
  );
}
