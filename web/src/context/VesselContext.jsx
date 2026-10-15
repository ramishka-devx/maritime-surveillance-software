import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useVesselUpdates } from '../hooks/useVesselUpdates.js';
import { defaultMaritimeFleet } from '../components/map/MapCanvas.jsx';

const VesselContext = createContext(null);

export function VesselProvider({ children }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Real-time polling via useVesselUpdates if backend is connected
  const { vessels: apiVessels } = useVesselUpdates(token, 8000);

  // Live backend AIS vessels merged with default maritime fleet fallback
  const allVessels = useMemo(() => {
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
          threatDetail: v.details || 'Live AIS kinematic transmission.',
          lastReport: 'Live AIS Ingest',
        }));

      const apiMmsiSet = new Set(formattedApi.map((v) => v.mmsi));
      const complement = defaultMaritimeFleet.filter((v) => !apiMmsiSet.has(v.mmsi));
      return [...formattedApi, ...complement];
    }
    return defaultMaritimeFleet || [];
  }, [apiVessels]);

  const [selectedVessel, setSelectedVessel] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);

  const focusVessel = useCallback(
    (target, zoom = 9) => {
      if (!target) return;

      // Handle if passed a vessel object or just an MMSI / ID string
      const vessel =
        typeof target === 'object'
          ? target
          : allVessels.find(
              (v) =>
                String(v.mmsi) === String(target) ||
                String(v.id) === String(target) ||
                String(v.imo) === String(target)
            );

      if (!vessel) return;

      setSelectedVessel(vessel);

      if (vessel.position && vessel.position.length >= 2) {
        setFocusTarget({
          lat: vessel.position[0],
          lon: vessel.position[1],
          zoom,
          mmsi: String(vessel.mmsi),
          timestamp: Date.now(),
        });
      }

      if (location.pathname !== '/') {
        navigate('/');
      }
    },
    [allVessels, location.pathname, navigate]
  );

  return (
    <VesselContext.Provider
      value={{
        vessels: allVessels,
        selectedVessel,
        setSelectedVessel,
        focusTarget,
        setFocusTarget,
        focusVessel,
      }}
    >
      {children}
    </VesselContext.Provider>
  );
}

export function useVesselContext() {
  const context = useContext(VesselContext);
  if (!context) {
    throw new Error('useVesselContext must be used within a VesselProvider');
  }
  return context;
}
