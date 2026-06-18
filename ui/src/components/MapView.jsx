import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom vessel icons based on status
const createVesselIcon = (status) => {
  const colors = {
    normal: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    unknown: '#94a3b8'
  };

  const color = colors[status] || colors.normal;
  
  return L.divIcon({
    html: `
      <div style="
        width: 12px;
        height: 12px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6]
  });
};

// Sample vessel data
const sampleVessels = [
  {
    id: 1,
    name: 'MV Ocean Star',
    mmsi: '563829104',
    type: 'Cargo',
    position: [14.5995, 120.9842], // Manila Bay area
    speed: 12.3,
    course: 214,
    status: 'warning'
  },
  {
    id: 2,
    name: 'SS Neptune',
    mmsi: '441208773',
    type: 'Tanker',
    position: [14.6204, 120.9448],
    speed: 1.8,
    course: 45,
    status: 'normal'
  },
  {
    id: 3,
    name: 'HMS Guardian',
    mmsi: '271998120',
    type: 'Military',
    position: [14.5823, 121.0182],
    speed: 8.5,
    course: 180,
    status: 'critical'
  },
  {
    id: 4,
    name: 'Unknown Vessel',
    mmsi: 'N/A',
    type: 'Unknown',
    position: [14.6384, 120.9684],
    speed: 0,
    course: 0,
    status: 'unknown'
  },
  {
    id: 5,
    name: 'SS Pacific',
    mmsi: '538110022',
    type: 'Container',
    position: [14.5512, 120.9948],
    speed: 15.2,
    course: 320,
    status: 'normal'
  }
];

const MapView = ({ vessels = sampleVessels, center = [14.5995, 120.9842], zoom = 12 }) => {
  // Note: center and zoom are only used for initial map creation
  // After that, the map maintains its own view state
  // Do NOT change these props or the map will reset

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: '0' }}
      zoomControl={true}
      className="maritime-map"
      scrollWheelZoom={true}
    >
      {/* Dark tiles for maritime theme */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Vessel markers - these update without resetting the map view */}
      {vessels.map((vessel) => (
        <Marker
          key={vessel.id}
          position={vessel.position}
          icon={createVesselIcon(vessel.status)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-gray-900">{vessel.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                <div><strong>MMSI:</strong> {vessel.mmsi}</div>
                <div><strong>Type:</strong> {vessel.type}</div>
                <div><strong>Speed:</strong> {vessel.speed} knots</div>
                <div><strong>Course:</strong> {vessel.course}°</div>
                <div><strong>Status:</strong> <span className="capitalize">{vessel.status}</span></div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
