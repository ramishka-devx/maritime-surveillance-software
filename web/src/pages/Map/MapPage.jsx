import React, { useState, useCallback, useEffect } from 'react';
import MapCanvas from '../../components/map/MapCanvas.jsx';
import FilterDrawer from '../../components/map/FilterDrawer.jsx';
import VesselDossierPopup from '../../components/map/VesselDossierPopup.jsx';
import AlertsStream from '../../components/map/AlertsStream.jsx';
import BottomHud from '../../components/map/BottomHud.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';

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
  const [activeLayer, setActiveLayer] = useState('vector');
  const [cursorCoords, setCursorCoords] = useState("07°52'23.2\"N 080°46'18.5\"E");
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(7);

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

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
    setCurrentZoom(map.getZoom());
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });
  }, []);

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
      mapInstance.setView([7.87, 80.2], 7, { animate: true });
    }
  }, [mapInstance]);

  const handleFocusAlert = (alert) => {
    const found = vessels.find((v) => String(v.mmsi) === String(alert.mmsi));
    if (found) {
      focusVessel(found);
    } else {
      focusVessel({
        name: alert.vesselName,
        callSign: 'TGT-ACT',
        flag: 'Classified / Monitored',
        type: alert.title,
        mmsi: alert.mmsi,
        imo: '9182341',
        position: [6.92, 79.84],
        coordinates: "06°55'10.4\"N 079°48'12.0\"E",
        sog: '16.4 KTS',
        cog: '055° T',
        heading: '056°',
        draught: '10.2 m',
        length: '188 m',
        beam: '28 m',
        destination: 'COLOMBO SECTOR PATROL',
        navStatus: 'Restricted Manoeuvrability',
        threatLevel: alert.type,
        threatReason: alert.title,
        threatDetail: alert.details,
        lastReport: alert.time,
      });
    }
    setIsDossierMinimized(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Interactive Nautical Map Viewport */}
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
      />

      {/* Left Floating Target Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
        filters={filters}
        onFilterChange={setFilters}
        vessels={fleetStats.allVessels.length > 0 ? fleetStats.allVessels : vessels}
        filteredCount={fleetStats.filteredCount}
      />

      {/* Floating Selected Vessel Dossier Popup Card */}
      {selectedVessel && (
        <VesselDossierPopup
          vessel={selectedVessel}
          isMinimized={isDossierMinimized}
          onToggleMinimize={() => setIsDossierMinimized(!isDossierMinimized)}
          onClose={() => setSelectedVessel(null)}
          onTrack={() => alert(`Tracking active: ${selectedVessel.name}`)}
          onIntercept={() => alert(`Vector intercept generated for ${selectedVessel.name}`)}
          onViewProfile={() => alert(`Opening comprehensive dossier for MMSI ${selectedVessel.mmsi}`)}
        />
      )}

      {/* Right Floating Incident / Threat Alerts Stream */}
      <AlertsStream
        isOpen={isAlertsOpen}
        onToggle={() => setIsAlertsOpen(!isAlertsOpen)}
        onFocusAlert={handleFocusAlert}
      />

      {/* Bottom HUD & Playback Toolbar */}
      <BottomHud
        cursorCoords={cursorCoords}
        activeLayer={activeLayer}
        currentZoom={currentZoom}
        onLayerChange={(layer) => setActiveLayer(layer)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetBearing={handleResetBearing}
      />
    </div>
  );
}
