/**
 * Map utilities for MapLibre GL vessel tracking
 */

/**
 * Convert an array of vessel objects to a GeoJSON FeatureCollection
 */
export function vesselArrayToGeoJson(vessels) {
  return {
    type: 'FeatureCollection',
    features: vessels.map((vessel) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(vessel.lon), parseFloat(vessel.lat)],
      },
      properties: {
        ...vessel,
        // Ensure sog is numeric for styling
        sog: parseFloat(vessel.sog) || 0,
        // Ensure heading is numeric for rotation
        heading: parseFloat(vessel.heading) || 0,
        // Status for color coding
        status: determineVesselStatus(vessel),
      },
    })),
  };
}

/**
 * Determine vessel status for styling
 */
function determineVesselStatus(vessel) {
  const speed = parseFloat(vessel.sog) || 0;
  if (speed > 20) return 'warning';
  if (vessel.nav_status === 1 || speed < 0.5) return 'normal';
  return 'normal';
}

/**
 * Create MapLibre GL layers for vessel tracking
 */
export function createVesselLayers(clusterZoom = 10) {
  return [
    // 1. Clusters Layer (only visible at low zoom)
    {
      id: 'vessel-clusters',
      type: 'circle',
      source: 'vessels',
      filter: ['has', 'point_count'],
      maxzoom: clusterZoom,
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1',
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    },
    // 2. Cluster Count Labels
    {
      id: 'vessel-cluster-count',
      type: 'symbol',
      source: 'vessels',
      filter: ['has', 'point_count'],
      maxzoom: clusterZoom,
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
    },
    // 3. Unclustered Individual Vessels
    {
      id: 'vessel-symbol',
      type: 'symbol',
      source: 'vessels',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': [
          'step',
          ['zoom'],
          'vessel-arrow',
          8,
          'vessel-ship'
        ],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 0.20,
          10, 0.25,
          14, 0.40,
          18, 0.55
        ],
        'icon-rotate': ['get', 'heading'],
        'icon-allow-overlap': true,
        'text-field': ['get', 'ship_name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-size': 11,
        'text-optional': true,
      },
      paint: {
        'text-color': '#fff',
        'text-halo-color': 'rgba(0,0,0,0.5)',
        'text-halo-width': 1,
      },
    },
  ];
}

/**
 * Create HTML for vessel popups
 */
export function createVesselPopupHtml(feature) {
  const p = feature.properties;
  const speed = parseFloat(p.sog).toFixed(1);
  const time = new Date(p.time_utc).toLocaleTimeString();

  return `
    <div class="vessel-popup">
      <div class="popup-header">
        <strong>${p.ship_name || 'Unknown Vessel'}</strong>
        <span class="mmsi">MMSI: ${p.mmsi}</span>
      </div>
      <div class="popup-body">
        <div class="stat"><label>Speed:</label> <span>${speed} kn</span></div>
        <div class="stat"><label>Heading:</label> <span>${p.heading}°</span></div>
        <div class="stat"><label>Last Update:</label> <span>${time}</span></div>
      </div>
    </div>
  `;
}
