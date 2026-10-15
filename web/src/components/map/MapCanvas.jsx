import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useVesselUpdates } from '../../hooks/useVesselUpdates.js';

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

/**
 * Creates custom directional vessel icon pointing in heading/course direction
 */
function createVesselMarkerIcon(vessel, isSelected = false) {
  const colors = {
    critical: '#ef4444',
    warning: '#f59e0b',
    normal: '#38bdf8',
    cargo: '#3b82f6',
    tanker: '#f59e0b',
    fishing: '#10b981',
    military: '#a855f7',
    unknown: '#94a3b8',
  };

  const statusKey = vessel.threatLevel?.toLowerCase() || vessel.status?.toLowerCase() || 'normal';
  const color = colors[statusKey] || colors.normal;
  const heading = vessel.heading || vessel.cog || vessel.course || 0;

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; items-center; justify-content: center;">
      ${
        isSelected
          ? `<div style="
              position: absolute;
              inset: -4px;
              border: 1.5px dashed ${color};
              border-radius: 50%;
              animation: spin 6s linear infinite;
              pointer-events: none;
            "></div>
            <div style="
              position: absolute;
              inset: -8px;
              border: 1px solid ${color};
              border-radius: 50%;
              opacity: 0.4;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              pointer-events: none;
            "></div>`
          : ''
      }
      <div style="
        transform: rotate(${heading}deg);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transition: transform 0.3s ease;
      ">
        <svg viewBox="0 0 32 32" width="26" height="26" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.7));">
          <!-- Directional Vessel Arrowhead -->
          <polygon
            points="16,2 26,28 16,22 6,28"
            fill="${color}"
            stroke="#ffffff"
            stroke-width="1.6"
          />
        </svg>
      </div>
      ${
        vessel.threatLevel === 'CRITICAL'
          ? `<span style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 8px;
              height: 8px;
              background-color: #ef4444;
              border: 1.5px solid #ffffff;
              border-radius: 50%;
            "></span>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vessel-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

// Map Controller Component to listen for events & center changes
function MapEventsHandler({ onCursorCoordsChange, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useMapEvents({
    mousemove(e) {
      if (onCursorCoordsChange) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const latDeg = Math.floor(Math.abs(lat));
        const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(1);
        const latDir = lat >= 0 ? 'N' : 'S';

        const lngDeg = Math.floor(Math.abs(lng));
        const lngMin = ((Math.abs(lng) - lngDeg) * 60).toFixed(1);
        const lngDir = lng >= 0 ? 'E' : 'W';

        onCursorCoordsChange(
          `${latDeg}°${latMin}'${latDir} 00${lngDeg}°${lngMin}'${lngDir}`
        );
      }
    },
  });
  return null;
}

// Map Controller Component to smoothly focus and fly to selected vessel
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

/**
 * Classifies vessel type into one of the 5 standard categories
 */
export function getVesselCategory(vessel) {
  if (!vessel) return 'special';
  const typeStr = (vessel.type || '').toLowerCase();
  if (typeStr.includes('tanker') || typeStr.includes('hazmat') || typeStr.includes('oil')) {
    return 'tanker';
  }
  if (
    typeStr.includes('cargo') ||
    typeStr.includes('container') ||
    typeStr.includes('carrier') ||
    typeStr.includes('bulk')
  ) {
    return 'cargo';
  }
  if (typeStr.includes('passenger') || typeStr.includes('ferry') || typeStr.includes('cruise')) {
    return 'passenger';
  }
  if (typeStr.includes('fish') || typeStr.includes('trawl')) {
    return 'fishing';
  }
  return 'special';
}

/**
 * Normalizes vessel threat classification
 */
export function getVesselThreat(vessel) {
  if (!vessel) return 'normal';
  const threat = (vessel.threatLevel || vessel.threat_level || '').toUpperCase();
  if (threat === 'CRITICAL') return 'critical';
  if (threat === 'WARNING') return 'warning';
  return 'normal';
}

// Built-in Sri Lanka Maritime Fleet Dataset (aligns with simulator zones & radar tracking)
export const defaultMaritimeFleet = [
  {
    id: '211284000',
    mmsi: '211284000',
    name: 'MV NORDIC SENTINEL',
    type: 'Crude Oil Tanker',
    flag: 'Panama (PA)',
    callSign: 'LAFX8',
    imo: '9482718',
    position: [6.88, 79.52],
    speed: 14.8,
    course: 42,
    heading: 44,
    draught: '12.4 m',
    length: '244 m',
    beam: '42 m',
    destination: 'COLOMBO (ETA 06-18:00)',
    navStatus: 'Underway Using Engine',
    threatLevel: 'CRITICAL',
    threatReason: 'AIS Spoofing & Identity Clone Detected (94% Conf.)',
    threatDetail: 'Synthetic kinematic signatures detected. Radar return offset 1.2nm from transponder position.',
    lastReport: '3s ago (AIS Base Stn 04)',
  },
  {
    id: '235089200',
    mmsi: '235089200',
    name: 'OCEAN VOYAGER',
    type: 'Fishing Trawler',
    flag: 'Sri Lanka (LK)',
    callSign: '4QZY4',
    imo: '8812904',
    position: [5.78, 80.35],
    speed: 6.8,
    course: 15,
    heading: 15,
    draught: '4.5 m',
    length: '56 m',
    beam: '11 m',
    destination: 'GALLE FISHING GROUNDS',
    navStatus: 'Engaged in Fishing',
    threatLevel: 'CRITICAL',
    threatReason: 'Geofence Incursion into Sector Bravo-4',
    threatDetail: 'Entered designated naval exclusion zone without transponder authorization.',
    lastReport: '1m ago',
  },
  {
    id: '244780000',
    mmsi: '244780000',
    name: 'STELLA MARIS',
    type: 'Container Ship',
    flag: 'Singapore (SG)',
    callSign: '9VHA',
    imo: '9320872',
    position: [5.85, 81.25],
    speed: 16.2,
    course: 110,
    heading: 110,
    draught: '9.8 m',
    length: '198 m',
    beam: '30 m',
    destination: 'HAMBANTOTA',
    navStatus: 'Underway Using Engine',
    threatLevel: 'WARNING',
    threatReason: 'Transponder Dark Event',
    threatDetail: 'Intermittent signal loss across Dondra Head TSS inbound lane.',
    lastReport: '4m ago',
  },
  {
    id: '352981000',
    mmsi: '352981000',
    name: 'PACIFIC OPAL',
    type: 'Bulk Carrier',
    flag: 'Marshall Islands (MH)',
    callSign: 'V7AB8',
    imo: '9510294',
    position: [7.65, 82.20],
    speed: 13.5,
    course: 220,
    heading: 220,
    draught: '13.2 m',
    length: '229 m',
    beam: '32 m',
    destination: 'TRINCOMALEE',
    navStatus: 'Underway Using Engine',
    threatLevel: 'WARNING',
    threatReason: 'Gross Course Deviation (>45°)',
    threatDetail: 'Departed assigned corridor into oncoming traffic zone.',
    lastReport: '8m ago',
  },
  {
    id: '311000452',
    mmsi: '311000452',
    name: 'SEA SWIFT',
    type: 'Fast Supply Vessel',
    flag: 'Bahamas (BS)',
    callSign: 'C6XY9',
    imo: '9604128',
    position: [8.85, 81.65],
    speed: 2.1,
    course: 80,
    heading: 80,
    draught: '3.8 m',
    length: '52 m',
    beam: '10 m',
    destination: 'OFFSHORE RENDEZVOUS',
    navStatus: 'Restricted Manoeuvrability',
    threatLevel: 'INFO',
    threatReason: 'Ship-to-Ship Transfer Alert',
    threatDetail: 'Loitering in proximity with unregistered target.',
    lastReport: '14m ago',
  },
  {
    id: '271998120',
    mmsi: '271998120',
    name: 'SLNS GAJABAHU',
    type: 'Patrol Corvette',
    flag: 'Sri Lanka (LK)',
    callSign: '4QVK',
    imo: '9840112',
    position: [6.95, 79.75],
    speed: 22.4,
    course: 38,
    heading: 40,
    draught: '5.2 m',
    length: '90 m',
    beam: '13 m',
    destination: 'COLOMBO SECTOR PATROL',
    navStatus: 'Underway Using Engine',
    threatLevel: 'NORMAL',
    threatReason: 'Coast Guard Unit',
    threatDetail: 'Active enforcement cutter monitoring Sector 04.',
    lastReport: '1s ago',
  },
  {
    id: '228031000',
    mmsi: '228031000',
    name: 'TALK ABOUT COTE',
    type: 'Passenger / Ferry',
    flag: 'Sri Lanka (LK)',
    callSign: '4QCF',
    imo: '9320128',
    position: [8.95, 79.55],
    speed: 18.6,
    course: 305,
    heading: 305,
    draught: '5.7 m',
    length: '142 m',
    beam: '24 m',
    destination: 'MANNAR FERRY TERMINAL',
    navStatus: 'Underway Using Engine',
    threatLevel: 'NORMAL',
    threatReason: 'Scheduled Ferry',
    threatDetail: 'Cross-strait ferry on timetable transit.',
    lastReport: '5s ago',
  },
];

export default function MapCanvas({
  selectedVesselId = null,
  onSelectVessel,
  activeLayer = 'vector',
  showRestricted = true,
  showTracks = true,
  onCursorCoordsChange,
  onMapReady,
  focusTarget = null,
  filters = null,
  onFleetUpdate = null,
  vessels: propVessels = null,
}) {
  const { token } = useAuth();
  const mapRef = useRef(null);

  // Real-time polling via useVesselUpdates if backend is connected
  const { vessels: apiVessels } = useVesselUpdates(token, 8000);

  // Merge API vessels with sample fleet if API has limited records
  const allVessels = useMemo(() => {
    if (propVessels && propVessels.length > 0) {
      return propVessels;
    }
    if (apiVessels && apiVessels.length > 0) {
      const formattedApi = apiVessels
        .filter((v) => v.lat && v.lon)
        .map((v) => ({
          id: String(v.mmsi || v.id),
          mmsi: String(v.mmsi || v.id),
          name: v.ship_name || v.name || `VESSEL ${v.mmsi}`,
          type: v.type || 'Commercial',
          flag: v.flag || 'International',
          callSign: v.callsign || 'N/A',
          imo: v.imo || 'N/A',
          position: [parseFloat(v.lat), parseFloat(v.lon)],
          speed: parseFloat(v.sog || v.speed || 0),
          course: parseFloat(v.cog || v.course || 0),
          heading: parseFloat(v.heading || v.cog || 0),
          draught: v.draught ? `${v.draught} m` : '8.5 m',
          length: v.length ? `${v.length} m` : '180 m',
          beam: v.beam ? `${v.beam} m` : '26 m',
          destination: v.destination || 'OPEN SEA',
          navStatus: v.nav_status || 'Underway Using Engine',
          threatLevel: v.threat_level || (v.anomaly ? 'CRITICAL' : 'NORMAL'),
          threatReason: v.anomaly || 'Standard Navigation',
          threatDetail: v.details || 'Normal AIS kinematic packet.',
          lastReport: 'Live AIS Ingest',
        }));

      // Combine with local reference vessels if not duplicate
      const apiMmsiSet = new Set(formattedApi.map((v) => v.mmsi));
      const complement = defaultMaritimeFleet.filter((v) => !apiMmsiSet.has(v.mmsi));
      return [...formattedApi, ...complement];
    }
    return defaultMaritimeFleet;
  }, [propVessels, apiVessels]);

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
    // Default: Dark Maritime styled OpenStreetMap (100% free, NO API key required)
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'dark-osm-tiles',
    };
  }, [activeLayer]);

  // Historical breadcrumb track positions
  const historicalTrackPoints = [
    [6.75, 79.35],
    [6.80, 79.42],
    [6.84, 79.48],
    [6.88, 79.52],
  ];

  // TSS Shipping Lanes (Southern Sri Lanka Dondra Head Separation Scheme)
  const northBoundLane = [
    [5.65, 79.20],
    [5.72, 80.50],
    [5.78, 81.80],
  ];
  const southBoundLane = [
    [5.48, 79.20],
    [5.55, 80.50],
    [5.60, 81.80],
  ];
  const separationZone = [
    [5.56, 79.20],
    [5.63, 80.50],
    [5.69, 81.80],
  ];

  // Restricted Area: Colombo Port & Naval Exclusion Zone
  const sectorBravo4Zone = [
    [6.93, 79.81],
    [6.97, 79.81],
    [6.97, 79.86],
    [6.93, 79.86],
  ];

  // Marine Conservation Sanctuary: Gulf of Mannar Biosphere
  const marineSanctuaryZone = [
    [8.85, 79.30],
    [9.25, 79.30],
    [9.25, 79.75],
    [8.85, 79.75],
  ];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" id="map-viewport">
      <MapContainer
        center={[7.87, 80.2]}
        zoom={7}
        zoomSnap={0.5}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', backgroundColor: '#070e1c' }}
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

        {/* Global Mouse Tracker for HUD Reticle & Map Instance Bridge */}
        <MapEventsHandler
          onCursorCoordsChange={onCursorCoordsChange}
          onMapReady={onMapReady}
        />

        {/* Global Smooth Focus Controller */}
        <MapFocusController focusTarget={focusTarget} />

        {/* TSS Traffic Corridors */}
        <Polyline
          positions={northBoundLane}
          pathOptions={{
            color: '#38bdf8',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.5,
          }}
        />
        <Polyline
          positions={separationZone}
          pathOptions={{
            color: '#f59e0b',
            weight: 2,
            dashArray: '8, 8',
            opacity: 0.6,
          }}
        />
        <Polyline
          positions={southBoundLane}
          pathOptions={{
            color: '#38bdf8',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.5,
          }}
        />

        {/* Restricted Security Zones & Sanctuaries */}
        {showRestricted && (
          <>
            <Polygon
              positions={sectorBravo4Zone}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.25,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <strong className="text-red-600 block uppercase font-mono">
                    Restricted: Sector Bravo-4
                  </strong>
                  <p className="text-gray-700 text-[11px] mt-1">
                    Naval Munitions Holding Area. Unauthorized maritime transit strictly prohibited under MDA protocols.
                  </p>
                </div>
              </Popup>
            </Polygon>

            <Polygon
              positions={marineSanctuaryZone}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.18,
                weight: 1.2,
                dashArray: '4, 4',
              }}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <strong className="text-amber-600 block uppercase font-mono">
                    Special Scientific Sanctuary
                  </strong>
                  <p className="text-gray-700 text-[11px] mt-1">
                    Marine habitat preservation area. Anchorage & high-speed maneuvering restricted.
                  </p>
                </div>
              </Popup>
            </Polygon>
          </>
        )}

        {/* Historical Track for Selected Vessel */}
        {showTracks && (
          <Polyline
            positions={historicalTrackPoints}
            pathOptions={{
              color: '#ef4444',
              weight: 2.5,
              dashArray: '4, 4',
              opacity: 0.8,
            }}
          />
        )}

        {/* Navigation Buoys / Aids to Navigation */}
        <CircleMarker
          center={[5.92, 80.59]}
          radius={5}
          pathOptions={{ color: '#000', fillColor: '#facc15', fillOpacity: 0.9, weight: 1.5 }}
        >
          <Popup>
            <div className="font-mono text-xs">
              <strong>DONDRA HEAD LIGHTHOUSE</strong>
              <div className="text-[10px] text-gray-600">Fl.W.10s // Southern TSS Cardinal</div>
            </div>
          </Popup>
        </CircleMarker>

        <CircleMarker
          center={[6.95, 79.83]}
          radius={5}
          pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 0.9, weight: 1.5 }}
        >
          <Popup>
            <div className="font-mono text-xs">
              <strong>COLOMBO FAIRWAY BUOY</strong>
              <div className="text-[10px] text-gray-600">Fl.R.5s // Harbour Approach</div>
            </div>
          </Popup>
        </CircleMarker>

        {/* Real-time Fleet Vessel Markers (Filtered with Selected Pinning) */}
        {displayVessels.map((vessel) => {
          const isSelected = selectedVesselId === String(vessel.mmsi);
          const icon = createVesselMarkerIcon(vessel, isSelected);

          return (
            <Marker
              key={vessel.id || vessel.mmsi}
              position={vessel.position}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectVessel) {
                    onSelectVessel(vessel);
                  }
                },
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
