import { apiRequest } from './api.js';

/**
 * Fetch latest AIS positions for all vessels
 * @param {string} token - Auth token
 * @param {number} limit - Max vessels to return (default: 500)
 * @returns {Promise<Array>} Array of vessel positions
 */
export async function getLatestVesselPositions(token, limit = 500, bbox = null) {
  const bboxParam = bbox ? `&bbox=${bbox}` : '';
  const data = await apiRequest(`/api/ais/positions/latest?limit=${limit}${bboxParam}`, { token });
  return data;
}

/**
 * Server-side vessel search by name (substring) or MMSI (prefix); rows include the latest
 * position so a hit can be focused on the map.
 */
export async function searchVessels(token, q) {
  return apiRequest(`/api/ais/vessels?q=${encodeURIComponent(q)}&limit=10`, { token });
}

/**
 * API row ({ mmsi, ship_name, sog, cog, heading, lat, lon, nav_status, ... }) -> the vessel
 * shape the map, dossier and search use.
 */
export function toUiVessel(v) {
  return {
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
    threatDetail: v.details || 'Live AIS kinematic transmission.',
    lastReport: 'Live AIS Ingest',
  };
}

/**
 * Fetch position history for a specific vessel by MMSI
 * @param {string} token - Auth token
 * @param {string} mmsi - Vessel MMSI
 * @param {number} limit - Max positions to return
 * @returns {Promise<Array>} Array of positions
 */
export async function getVesselPositionsByMmsi(token, mmsi, limit = 200) {
  const data = await apiRequest(`/api/ais/positions/${mmsi}?limit=${limit}`, { token });
  return data;
}

/**
 * Fetch list of all vessels (without positions)
 * @param {string} token - Auth token
 * @param {number} limit - Max vessels to return
 * @returns {Promise<Array>} Array of vessels
 */
export async function getVessels(token, limit = 500) {
  const data = await apiRequest(`/api/ais/vessels?limit=${limit}`, { token });
  return data;
}

/**
 * Transform API vessel data to map format
 * Expected API response: { mmsi, ship_name, sog, cog, lat, lon, nav_status, ... }
 */
export function transformVesselData(apiVessels) {
  return apiVessels.map((vessel) => ({
    id: vessel.mmsi,
    name: vessel.ship_name || 'Unknown',
    mmsi: vessel.mmsi,
    type: determineVesselType(vessel.nav_status),
    position: [parseFloat(vessel.lat), parseFloat(vessel.lon)],
    speed: parseFloat(vessel.sog) || 0,
    course: parseFloat(vessel.cog) || 0,
    heading: vessel.heading || 0,
    status: determineVesselStatus(vessel),
    lastUpdate: vessel.time_utc,
  }));
}

/**
 * Determine vessel type from nav_status or other data
 */
function determineVesselType(navStatus) {
  // You can enhance this based on your data
  const statusMap = {
    0: 'Under way',
    1: 'At anchor',
    2: 'Not under command',
    3: 'Restricted maneuverability',
    5: 'Moored',
    // Add more as needed
  };
  return statusMap[navStatus] || 'Unknown';
}

/**
 * Determine vessel status for color coding
 */
function determineVesselStatus(vessel) {
  // Example logic - customize based on your business rules
  const speed = parseFloat(vessel.sog) || 0;
  
  // Check if vessel is in restricted zone (you'd add real zone checking)
  // Check if AIS is recent
  const lastUpdateTime = new Date(vessel.time_utc);
  const ageInMinutes = (Date.now() - lastUpdateTime) / 1000 / 60;
  
  if (ageInMinutes > 30) return 'unknown'; // Old data
  if (speed < 0.5 && vessel.nav_status === 1) return 'normal'; // Anchored
  if (speed > 20) return 'warning'; // High speed
  
  return 'normal';
}
