import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useVesselUpdates } from '../hooks/useVesselUpdates.js';
import { toUiVessel } from '../lib/vessels.js';
import { defaultMaritimeFleet } from '../components/map/MapCanvas.jsx';
import { isMaintenance } from '../auth/roles.js';

const VesselContext = createContext(null);

export function VesselProvider({ children }) {
  const { token: authToken, user } = useAuth();
  const token = isMaintenance(user) ? null : authToken;
  const navigate = useNavigate();
  const location = useLocation();

  // Map viewport as "minLon,minLat,maxLon,maxLat", set by the map page while it's mounted so
  // only vessels in view are fetched; null = the global most-recent list (other pages).
  const [viewport, setViewport] = useState(null);

  // Real-time polling via useVesselUpdates if backend is connected
  const { vessels: apiVessels } = useVesselUpdates(token, 8000, viewport);

  // Live backend AIS vessels merged with default maritime fleet fallback
  const allVessels = useMemo(() => {
    if (apiVessels && apiVessels.length > 0) {
      const formattedApi = apiVessels.filter((v) => v.lat && v.lon).map(toUiVessel);

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
        setViewport,
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
