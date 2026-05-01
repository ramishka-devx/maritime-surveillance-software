// ============================================================================
// VESSELMAP QUICK START - Copy/Paste Ready Code Snippets
// ============================================================================

// ============================================================================
// SETUP 1: MINIMAL INTEGRATION (5 LINES)
// ============================================================================

// In your component file:
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';

export default function VesselPage() {
  const { token } = useAuth();
  return (
    <div style={{ height: '100vh' }}>
      <VesselMap token={token} />
    </div>
  );
}

// That's it! The map will automatically:
// - Initialize MapLibre GL
// - Fetch vessel data every 5 seconds
// - Display vessels with clustering
// - Show popups on click

// ============================================================================
// SETUP 2: WITH CUSTOM OPTIONS
// ============================================================================

import React, { useRef } from 'react';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';

export default function VesselPageAdvanced() {
  const { token } = useAuth();
  const mapRef = useRef(null);

  const handleVesselClick = (feature) => {
    const { ship_name, mmsi, sog } = feature.properties;
    console.log(`Clicked: ${ship_name} (${mmsi}) - ${sog} knots`);
  };

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <VesselMap
        ref={mapRef}
        token={token}
        options={{
          center: [120.9842, 14.5995],  // Manila Bay
          zoom: 8,
          pollInterval: 5000,           // Update every 5 seconds
          clusterZoom: 10,              // Stop clustering at zoom 10+
          style: 'https://tiles.openfreemap.org/styles/positron'
        }}
        onVesselClick={handleVesselClick}
        onError={(err) => console.error('Map error:', err)}
      />

      {/* Show stats button */}
      <button
        onClick={() => {
          const stats = mapRef.current?.getStats();
          console.log('Stats:', stats);
        }}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: '10px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 10,
          fontWeight: 600
        }}
      >
        Show Stats
      </button>
    </div>
  );
}

// ============================================================================
// SETUP 3: WITH REACT ROUTER
// ============================================================================

import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';

export default function VesselDetailPage() {
  const { token } = useAuth();
  const { vesselMmsi } = useParams();
  const mapRef = useRef(null);

  const handleVesselClick = (feature) => {
    if (feature.properties.mmsi === vesselMmsi) {
      // Highlight selected vessel somehow
      console.log('Selected vessel is visible on map');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Map on left */}
      <div style={{ flex: 1 }}>
        <VesselMap
          ref={mapRef}
          token={token}
          options={{
            zoom: 8,
            pollInterval: 3000, // Faster for focused view
          }}
          onVesselClick={handleVesselClick}
        />
      </div>

      {/* Details on right */}
      <div style={{ width: '300px', padding: '20px', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
        <h3>Vessel Details</h3>
        <p>MMSI: {vesselMmsi}</p>
        <p>
          <button
            onClick={() => {
              // Fly map to vessel location
              // (in real app, get coordinates from API or selected vessel)
              mapRef.current?.flyTo({
                center: [120.9842, 14.5995],
                zoom: 14,
                duration: 1000
              });
            }}
          >
            Show on Map
          </button>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SETUP 4: DASHBOARD WITH MULTIPLE MAPS
// ============================================================================

import React from 'react';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';

export default function VesselDashboard() {
  const { token } = useAuth();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      height: '100vh',
      gap: '8px'
    }}>
      {/* Global view - slow updates */}
      <div>
        <h3 style={{ position: 'absolute', top: 10, left: 10, zIndex: 5 }}>Global View</h3>
        <VesselMap
          token={token}
          options={{
            center: [0, 20],
            zoom: 2,
            pollInterval: 30000 // 30 seconds
          }}
        />
      </div>

      {/* Regional view - fast updates */}
      <div>
        <h3 style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>Manila Bay</h3>
        <VesselMap
          token={token}
          options={{
            center: [120.9842, 14.5995],
            zoom: 9,
            pollInterval: 3000 // 3 seconds
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SETUP 5: WITH ERROR BOUNDARY
// ============================================================================

import React from 'react';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee2e2'
        }}>
          <div style={{ textAlign: 'center', color: '#7f1d1d' }}>
            <h2>Map Error</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function VesselPageSafe() {
  const { token } = useAuth();

  return (
    <MapErrorBoundary>
      <div style={{ height: '100vh' }}>
        <VesselMap token={token} />
      </div>
    </MapErrorBoundary>
  );
}

// ============================================================================
// SETUP 6: WITH CUSTOM STYLING
// ============================================================================

import React from 'react';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';
import './custom-map.css';

export default function VesselPageStyled() {
  const { token } = useAuth();

  return (
    <div className="vessel-page">
      <header className="vessel-header">
        <h1>Marine Vessel Tracking</h1>
        <p>Real-time vessel positions and tracking</p>
      </header>

      <div className="vessel-map-container">
        <VesselMap
          token={token}
          options={{
            zoom: 5,
            center: [120.9842, 14.5995]
          }}
        />
      </div>

      <footer className="vessel-footer">
        <p>Last update: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
}

// CSS file (custom-map.css):
/*
.vessel-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.vessel-header {
  padding: 20px;
  background-color: #1e40af;
  color: white;
}

.vessel-map-container {
  flex: 1;
  position: relative;
}

.vessel-footer {
  padding: 12px 20px;
  background-color: #f3f4f6;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
}
*/

// ============================================================================
// SETUP 7: WITH FILTERING
// ============================================================================

import React, { useState, useEffect } from 'react';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/auth/AuthContext';

export default function VesselPageFiltered() {
  const { token } = useAuth();
  const [filter, setFilter] = useState('all');

  // Note: Filtering is typically done on the API side
  // This is a client-side example of handling different vessel types

  const handleVesselClick = (feature) => {
    if (filter === 'all') {
      console.log('Vessel:', feature.properties.ship_name);
    } else if (filter === 'moving' && feature.properties.sog > 0.5) {
      console.log('Moving vessel:', feature.properties.ship_name);
    } else if (filter === 'anchored' && feature.properties.nav_status === 1) {
      console.log('Anchored vessel:', feature.properties.ship_name);
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Filter buttons */}
      <div style={{ padding: '10px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
        {['all', 'moving', 'anchored'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === type ? '#3b82f6' : '#f3f4f6',
              color: filter === type ? '#fff' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <VesselMap
          token={token}
          options={{ zoom: 8 }}
          onVesselClick={handleVesselClick}
        />
      </div>
    </div>
  );
}

// ============================================================================
// USEFUL UTILITIES
// ============================================================================

// Get distance between two coordinates
export function getDistance(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if coordinate is within bounds
export function isWithinBounds(coordinate, bounds) {
  const [lng, lat] = coordinate;
  return (
    lng >= bounds.sw.lng &&
    lng <= bounds.ne.lng &&
    lat >= bounds.sw.lat &&
    lat <= bounds.ne.lat
  );
}

// Format vessel speed nicely
export function formatSpeed(sog) {
  if (!sog) return '0 knots';
  return `${parseFloat(sog).toFixed(1)} knots`;
}

// Format heading nicely
export function formatHeading(heading) {
  const deg = parseInt(heading);
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dir = dirs[Math.round(deg / 22.5) % 16];
  return `${deg}° (${dir})`;
}

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

/*
ISSUE: Map not showing
SOLUTION:
1. Ensure container has height: style={{ height: '100vh' }}
2. Check CSS imports: import 'maplibre-gl/dist/maplibre-gl.css'
3. Check browser console for errors

ISSUE: Vessels not appearing
SOLUTION:
1. Open DevTools Network tab
2. Look for /api/ais/positions/latest request
3. Check if it returns data
4. Verify auth token is valid

ISSUE: Poor performance
SOLUTION:
1. Increase pollInterval to 10000 (10 seconds)
2. Increase clusterZoom to 12
3. Check DevTools Performance tab for bottlenecks

ISSUE: Popup doesn't show
SOLUTION:
1. Check browser console for JavaScript errors
2. Verify click handler is enabled
3. Try clicking on a different vessel

ISSUE: Memory leak
SOLUTION:
1. Check DevTools Memory tab
2. Ensure component cleanup on unmount
3. Look for dangling interval timers
*/

// ============================================================================
// NEXT STEPS
// ============================================================================

/*
1. Copy one of the SETUP examples above into your component file
2. Replace @/components path with your actual path
3. Ensure MapLibre GL is installed: npm install maplibre-gl --save
4. Test by running your dev server
5. Check the map appears and loads vessels
6. Click on a vessel to see popup
7. Zoom in/out to see clustering in action
8. Check DevTools Console for any errors

For more details, see:
- README_VESSELMAP.md - Full documentation
- VESSELMAP_ARCHITECTURE.md - Design decisions
- VesselMapExample.jsx - More examples
*/
