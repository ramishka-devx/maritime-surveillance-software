import React, { useState, useCallback, useEffect, useMemo } from 'react';
import MapCanvas from '../../components/map/MapCanvas.jsx';
import { VESSEL_TYPES, getVesselThreat } from '../../components/map/vesselCanvasLayer.js';
import FilterDrawer from '../../components/map/FilterDrawer.jsx';
import VesselDossierPopup from '../../components/map/VesselDossierPopup.jsx';
import AlertsStream from '../../components/map/AlertsStream.jsx';
import BottomHud from '../../components/map/BottomHud.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';
import { splitSegments } from '../../lib/track.js';

export default function MapPage() {
  const {
    vessels,
    selectedVessel,
    setSelectedVessel,
    focusTarget,
    focusVessel,
    setViewport,
  } = useVesselContext();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isDossierMinimized, setIsDossierMinimized] = useState(false);
  const [activeLayer, setActiveLayer] = useState('enc');
  const [cursorCoords, setCursorCoords] = useState('');
  const [mapInstance, setMapInstance] = useState(null);

  // Fleet target filters state
  const [filters, setFilters] = useState({
    types: ['cargo', 'tanker', 'passenger', 'fishing', 'special'],
    threats: ['critical', 'warning', 'normal'],
    minSpeed: 0,
    maxSpeed: 35,
  });

  // Fleet stats reported by map
  const [fleetStats, setFleetStats] = useState({
    totalCount: 0,
    filteredCount: 0,
    allVessels: [],
  });

  // When a vessel is focused (e.g. from Global Search Bar), ensure dossier is open
  useEffect(() => {
    if (selectedVessel) {
      setIsDossierMinimized(false);
    }
  }, [selectedVessel]);

  const handleMapReady = useCallback((map) => setMapInstance(map), []);

  // Track / Dossier for the selected vessel. Keyed by MMSI, so picking another vessel
  // simply starts from a blank state; the 24 h history is fetched once and shared.
  const { token } = useAuth();
  const selMmsi = selectedVessel?.mmsi ? String(selectedVessel.mmsi) : null;
  const [historyState, setHistoryState] = useState({ mmsi: null });
  const history = historyState.mmsi === selMmsi ? historyState : { mmsi: selMmsi };

  const toggleHistory = (key) => {
    if (!selMmsi) return;
    const next = { ...history, [key]: !history[key] };
    if (!next[key] || history.points || history.loading) return setHistoryState(next);

    setHistoryState({ ...next, loading: true, error: null });
    const from = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const update = (patch) => setHistoryState((h) => (h.mmsi === selMmsi ? { ...h, loading: false, ...patch } : h));
    Promise.all([
      apiRequest(`/api/ais/positions/${selMmsi}?from=${encodeURIComponent(from)}&limit=5000`, { token }),
      apiRequest(`/api/alerts?mmsi=${selMmsi}&limit=20`, { token })
        .then((r) => r.rows || [])
        .catch(() => []),
    ])
      .then(([rows, alerts]) => update({ points: [...(rows || [])].reverse(), alerts }))
      .catch((err) => update({ error: err.message || 'Could not load vessel history' }));
  };

  const trackSegments = useMemo(
    () => (history.track && history.points ? splitSegments(history.points) : null),
    [history.track, history.points]
  );

  const flaggedCount = useMemo(
    () => fleetStats.allVessels.filter((v) => getVesselThreat(v) !== 'normal').length,
    [fleetStats.allVessels]
  );

  // Stable (memoised) so MapCanvas — memo'd, with ~1000 markers — doesn't re-render on
  // unrelated MapPage state changes such as the cursor-coordinate readout on every mousemove.
  const handleSelectVessel = useCallback(
    (vessel) => {
      if (typeof vessel === 'object' && vessel !== null) {
        focusVessel(vessel);
        setIsDossierMinimized(false);
      }
    },
    [focusVessel]
  );

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  }, [mapInstance]);

  const handleResetBearing = useCallback(() => {
    if (mapInstance) {
      mapInstance.setView([52.59, 6.158], 7, { animate: true });
    }
  }, [mapInstance]);

  const handleFocusAlert = (alert) => {
    const found = vessels.find((v) => String(v.mmsi) === String(alert.mmsi));
    if (found) {
      focusVessel(found);
    } else if (alert.lat != null && alert.lon != null) {
      // Vessel isn't in the current view's feed: open the alert at its recorded position.
      focusVessel({
        name: alert.vesselName,
        mmsi: alert.mmsi,
        position: [Number(alert.lat), Number(alert.lon)],
        threatLevel: alert.type,
        threatReason: alert.title,
        threatDetail: alert.details,
        lastReport: alert.time,
      });
    }
    setIsDossierMinimized(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-bs-bg text-bs-ink select-none">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Interactive nautical map */}
        <MapCanvas
          selectedVesselId={selectedVessel?.mmsi}
          onSelectVessel={handleSelectVessel}
          activeLayer={activeLayer}
          onCursorCoordsChange={setCursorCoords}
          onMapReady={handleMapReady}
          onViewportChange={setViewport}
          focusTarget={focusTarget}
          vessels={vessels}
          filters={filters}
          onFleetUpdate={setFleetStats}
          track={trackSegments}
        />

        {/* Colour key: type colours for normal traffic, magenta box for alerts */}
        <div className="absolute left-6 bottom-6 z-30 flex flex-wrap items-center gap-x-4 gap-y-1 max-w-[calc(100%-3rem)] px-3 py-2 bg-bs-bg/90 shadow-bs-sm text-[12px]">
          {VESSEL_TYPES.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
              {t.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-bs-accent-2-700">
            <span className="w-3 h-3 border-[1.5px] border-dashed border-bs-accent-2" />
            Alert
          </span>
        </div>

        <FilterDrawer
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
          filters={filters}
          onFilterChange={setFilters}
          vessels={fleetStats.allVessels.length > 0 ? fleetStats.allVessels : vessels}
          filteredCount={fleetStats.filteredCount}
        />

        {selectedVessel && (
          <VesselDossierPopup
            vessel={selectedVessel}
            left={isFilterOpen ? 368 : 24}
            isMinimized={isDossierMinimized}
            onToggleMinimize={() => setIsDossierMinimized(!isDossierMinimized)}
            onClose={() => setSelectedVessel(null)}
            trackOn={!!history.track}
            dossierOn={!!history.dossier}
            history={history}
            onTrack={() => toggleHistory('track')}
            onDossier={() => toggleHistory('dossier')}
          />
        )}

        <AlertsStream
          isOpen={isAlertsOpen}
          onToggle={() => setIsAlertsOpen(!isAlertsOpen)}
          onFocusAlert={handleFocusAlert}
        />
      </div>

      <BottomHud
        cursorCoords={cursorCoords}
        activeLayer={activeLayer}
        vesselCount={fleetStats.filteredCount}
        flaggedCount={flaggedCount}
        onLayerChange={setActiveLayer}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetBearing={handleResetBearing}
      />
    </div>
  );
}
