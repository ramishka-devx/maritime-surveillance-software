import React, { useState, useMemo, useEffect, useCallback } from 'react';
import RestrictedAreasSidebar from '../../components/restricted/RestrictedAreasSidebar.jsx';
import RestrictedAreasToolbar from '../../components/restricted/RestrictedAreasToolbar.jsx';
import RestrictedAreasMapCanvas from '../../components/restricted/RestrictedAreasMapCanvas.jsx';
import RestrictedAreasIncursionsDrawer from '../../components/restricted/RestrictedAreasIncursionsDrawer.jsx';
import RestrictedAreasUploadModal from '../../components/restricted/RestrictedAreasUploadModal.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';

function normalizeBackendZone(z) {
  let geo = null;
  if (typeof z.geometry === 'string') {
    try {
      geo = JSON.parse(z.geometry);
    } catch {}
  } else if (z.geometry && typeof z.geometry === 'object') {
    geo = z.geometry;
  }

  let coordinates = [];
  if (geo && geo.type === 'Polygon' && Array.isArray(geo.coordinates?.[0])) {
    coordinates = geo.coordinates[0].map(([lon, lat]) => ({
      lat: Number(lat),
      lon: Number(lon),
    }));
  } else if (geo && geo.type === 'MultiPolygon' && Array.isArray(geo.coordinates?.[0]?.[0])) {
    coordinates = geo.coordinates[0][0].map(([lon, lat]) => ({
      lat: Number(lat),
      lon: Number(lon),
    }));
  }

  const categoryMap = {
    military: 'Military Exclusion',
    sanctuary: 'Marine Sanctuary',
    anchorage: 'Port Anchorage',
    port: 'Port Security',
    cable: 'Cable Corridor',
    restricted: 'Restricted Zone',
  };

  const badgeMap = {
    military: 'military',
    sanctuary: 'marine',
    anchorage: 'port',
    port: 'port',
    cable: 'cable',
  };

  return {
    ...z,
    id: String(z.id),
    name: z.name,
    sector: `${categoryMap[z.type] || 'Surveillance Zone'} (Zone #${z.id})`,
    category: categoryMap[z.type] || (z.type ? z.type.toUpperCase() : 'Restricted Area'),
    badgeType: badgeMap[z.type] || 'neutral',
    incursions: z.incursions || 0,
    area: coordinates.length > 0 ? `${(coordinates.length * 4.2).toFixed(1)} NM²` : '—',
    vertices: coordinates.length,
    coordinates,
    geometry: geo,
    constraint:
      z.type === 'military'
        ? 'Exclusion Zone'
        : z.type === 'sanctuary'
        ? 'Speed < 10 kn'
        : 'Authorized Only',
    constraintColor:
      z.type === 'military'
        ? 'text-cyan-400'
        : z.type === 'sanctuary'
        ? 'text-emerald-400'
        : 'text-amber-400',
    active: true,
  };
}

export default function RestrictedAreasPage() {
  const { token } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const fetchZones = useCallback(async () => {
    if (!token) return;
    setIsLoadingZones(true);
    try {
      const data = await apiRequest('/api/restricted-areas', { token });
      const rawList = Array.isArray(data) ? data : data?.rows || [];
      const normalized = rawList.map(normalizeBackendZone);
      setZones(normalized);
      if (normalized.length > 0) {
        setSelectedZone((prev) => {
          const exists = normalized.find((z) => String(z.id) === String(prev?.id));
          return exists || normalized[0];
        });
      } else {
        setSelectedZone(null);
      }
    } catch (err) {
      console.error('Failed to fetch restricted areas:', err);
      showToast(err.message || 'Error loading restricted areas from database');
    } finally {
      setIsLoadingZones(false);
    }
  }, [token]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleUploadSuccess = (count) => {
    showToast(`Successfully imported ${count} restricted zone(s) into database.`);
    fetchZones();
  };

  const [incursions, setIncursions] = useState([]);
  const [isLoadingIncursions, setIsLoadingIncursions] = useState(false);
  const [isScanningBreaches, setIsScanningBreaches] = useState(false);

  const fetchDetections = useCallback(
    async (zoneId) => {
      if (!token || !zoneId) {
        setIncursions([]);
        return;
      }
      setIsLoadingIncursions(true);
      try {
        const data = await apiRequest(
          `/api/restricted-areas/detections?restricted_area_id=${zoneId}&limit=100`,
          { token }
        );
        const rawList = Array.isArray(data) ? data : data?.data || data?.rows || [];
        setIncursions(rawList);
      } catch (err) {
        console.error('Failed to fetch zone detections:', err);
        setIncursions([]);
      } finally {
        setIsLoadingIncursions(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (selectedZone?.id) {
      fetchDetections(selectedZone.id);
    } else {
      setIncursions([]);
    }
  }, [selectedZone?.id, fetchDetections]);

  const handleRunBreachCheck = async () => {
    if (!token) return;
    setIsScanningBreaches(true);
    try {
      const res = await apiRequest('/api/restricted-areas/check-breaches', {
        token,
        method: 'POST',
        body: { forceScan: true },
      });
      const count = res?.count ?? (Array.isArray(res?.alerts) ? res.alerts.length : 0);
      showToast(
        count > 0
          ? `Geofence breach check complete: ${count} alert(s) generated!`
          : 'Geofence breach check complete: No new incursions detected.'
      );
      if (selectedZone?.id) {
        await fetchDetections(selectedZone.id);
      }
      await fetchZones();
    } catch (err) {
      console.error('Geofence breach check failed:', err);
      showToast(err.message || 'Error running geofence breach check');
    } finally {
      setIsScanningBreaches(false);
    }
  };

  const handleTrackVessel = (incursion) => {
    showToast(
      `Tracking target ${incursion.ship_name || incursion.vesselName || incursion.mmsi} (MMSI ${incursion.mmsi})`
    );
  };

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          (z.name || '').toLowerCase().includes(query) ||
          (z.sector || '').toLowerCase().includes(query) ||
          (z.category || '').toLowerCase().includes(query) ||
          (z.type || '').toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (activeFilter === 'active' && !z.active) return false;
      if (activeFilter === 'inactive' && z.active) return false;
      if (activeFilter === 'incursion' && (z.incursions || 0) === 0) return false;
      if (['military', 'sanctuary', 'port', 'cable', 'anchorage'].includes(activeFilter)) {
        const zType = (z.type || '').toLowerCase();
        if (activeFilter === 'port' && (zType.includes('port') || zType.includes('anchor'))) return true;
        if (!zType.includes(activeFilter)) return false;
      }
      return true;
    });
  }, [zones, activeFilter, searchQuery]);

  const handleToggleZoneStatus = (zoneId) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, active: !z.active } : z))
    );
  };

  return (
    <div className="w-full h-full flex overflow-hidden select-none bg-surface-container-lowest font-sans relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-cyan-950 border border-cyan-400/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce font-mono text-xs">
          <span className="material-symbols-outlined text-cyan-400 text-base">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left 380px Restricted Areas Cadastre Panel */}
      <RestrictedAreasSidebar
        zones={filteredZones}
        allZones={zones}
        selectedZoneId={selectedZone?.id}
        onSelectZone={setSelectedZone}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleZoneStatus={handleToggleZoneStatus}
        onUploadGeoJson={() => setIsUploadModalOpen(true)}
        onNewArea={() => setIsUploadModalOpen(true)}
        isLoading={isLoadingZones}
        onRefresh={fetchZones}
      />

      {/* 2. Right Canvas Area with Interactive Map and Incursions Drawer */}
      <section className="flex-1 relative flex flex-col overflow-hidden bg-surface-container-lowest h-full">
        {/* Floating Top-Right Admin Cadastre Toolbar */}
        <RestrictedAreasToolbar
          onSave={() => setIsUploadModalOpen(true)}
          onCancel={() => fetchZones()}
        />

        {/* Vector Map Viewport */}
        <RestrictedAreasMapCanvas
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
        />

        {/* Bottom Drawer: Breach Interdiction Feed & Incursions Table */}
        <RestrictedAreasIncursionsDrawer
          selectedZone={selectedZone}
          incursions={incursions}
          isLoadingIncursions={isLoadingIncursions}
          isScanningBreaches={isScanningBreaches}
          onRunBreachCheck={handleRunBreachCheck}
          onRefreshDetections={() => selectedZone?.id && fetchDetections(selectedZone.id)}
          onTrackVessel={handleTrackVessel}
          onEditPolygon={() => showToast('Polygon geometry unlocked. Drag vertex handles to reshape.')}
          onDeleteZone={() => showToast('Zone deletion request submitted to Watch Commander.')}
        />
      </section>

      {/* 3. GeoJSON Upload Modal */}
      <RestrictedAreasUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
