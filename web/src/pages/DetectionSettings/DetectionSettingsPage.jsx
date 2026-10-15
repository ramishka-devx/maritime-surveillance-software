import React, { useState, useMemo } from 'react';
import DetectionHeaderBar from '../../components/detection/DetectionHeaderBar.jsx';
import DetectionModulesNav from '../../components/detection/DetectionModulesNav.jsx';
import DetectionConfigForm from '../../components/detection/DetectionConfigForm.jsx';
import DetectionImpactPreview from '../../components/detection/DetectionImpactPreview.jsx';
import DetectionAuditLog from '../../components/detection/DetectionAuditLog.jsx';

const DETECTION_MODELS = [
  {
    id: 'speed',
    name: 'Speed Anomaly',
    badge: 'ACTIVE',
    badgeColor: 'bg-cyan-950/60 border border-cyan-400/40 text-cyan-300',
    icon: 'speed',
    description: 'Kinematic sprint & peer outlier engine',
    fullDescription: 'Detects kinematic deviations and abnormal sprint velocities benchmarked against vessel class peer baselines (e.g. ULCC Tankers vs Fast Patrol Craft).',
    engine: 'ISOLATION FOREST v2',
  },
  {
    id: 'restricted',
    name: 'Restricted Areas',
    badge: '12 ZONES',
    badgeColor: 'bg-surface-container-highest text-outline',
    icon: 'security',
    description: 'Geofence incursion & EEZ triggers',
    fullDescription: 'Continuous spatial polygon ray-casting intersecting real-time vessel vectors with territorial boundaries, MPA reserves, and critical subsea cable pipelines.',
    engine: 'RAY-CASTING POLYGON v3',
  },
  {
    id: 'dark',
    name: 'Dark Vessels',
    badge: 'DEFCON 2',
    badgeColor: 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300',
    icon: 'sensors_off',
    description: 'AIS gap & MMSI transponder spoofing',
    fullDescription: 'Evaluates unexplained transmission dropouts, trajectory discontinuities, and dead reckoning extrapolations against satellite RF radar correlation.',
    engine: 'KALMAN FILTER STATE-SPACE',
  },
  {
    id: 'loitering',
    name: 'Loitering',
    badge: '<2.0 KTS',
    badgeColor: 'bg-surface-container-highest text-outline',
    icon: 'timelapse',
    description: 'Rendezvous drift pattern heuristics',
    fullDescription: 'Identifies non-transit drift circles, suspicious STS (ship-to-ship) rendezvous clustering, and offshore hovering outside authorized anchorage coordinates.',
    engine: 'CONVEX HULL DRIFT ENGINE',
  },
  {
    id: 'collision',
    name: 'Collision Risk',
    badge: 'CPA/TCPA',
    badgeColor: 'bg-surface-container-highest text-outline',
    icon: 'crisis_alert',
    description: 'Closest point kinematics & bearing vector',
    fullDescription: 'Continuous Closest Point of Approach (CPA) and Time to CPA (TCPA) calculation for intersecting target vectors, navigational channel bottlenecks, and harbor entrances.',
    engine: 'VECTOR BEARING MATRIX',
  },
  {
    id: 'severity',
    name: 'Severity Mapping',
    badge: 'NATO TIER',
    badgeColor: 'bg-surface-container-highest text-outline',
    icon: 'rule',
    description: 'Multi-factor priority & escalation tiers',
    fullDescription: 'Aggregates multi-source anomaly scores into unified threat severity bands (CRITICAL, HIGH, MEDIUM, LOW) to govern automated incident dispatch queues.',
    engine: 'DYNAMIC RISK CLASSIFIER',
  },
];

const DEFAULT_CONFIGS = {
  speed: {
    enabled: true,
    peerSamples: 240,
    contamination: 0.05,
    percentile: 'p99',
    surgeCeiling: '+8.5 KTS/MIN',
    consecutiveSamples: '3 PINGS (30S)',
  },
  restricted: {
    enabled: true,
    peerSamples: 180,
    contamination: 0.03,
    percentile: 'p99.5',
    surgeCeiling: '+5.0 KTS/MIN',
    consecutiveSamples: '2 PINGS (20S)',
  },
  dark: {
    enabled: true,
    peerSamples: 300,
    contamination: 0.04,
    percentile: 'p99',
    surgeCeiling: '+10.0 KTS/MIN',
    consecutiveSamples: '4 PINGS (40S)',
  },
  loitering: {
    enabled: true,
    peerSamples: 150,
    contamination: 0.06,
    percentile: 'p95',
    surgeCeiling: '+3.0 KTS/MIN',
    consecutiveSamples: '6 PINGS (60S)',
  },
  collision: {
    enabled: true,
    peerSamples: 200,
    contamination: 0.02,
    percentile: 'p99.5',
    surgeCeiling: '+12.0 KTS/MIN',
    consecutiveSamples: '2 PINGS (20S)',
  },
  severity: {
    enabled: true,
    peerSamples: 250,
    contamination: 0.05,
    percentile: 'p99',
    surgeCeiling: '+8.0 KTS/MIN',
    consecutiveSamples: '3 PINGS (30S)',
  },
};

export default function DetectionSettingsPage() {
  const [selectedModelId, setSelectedModelId] = useState('speed');
  const [searchFilter, setSearchFilter] = useState('');
  const [modelConfigs, setModelConfigs] = useState(DEFAULT_CONFIGS);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const activeModel = useMemo(() => {
    return DETECTION_MODELS.find((m) => m.id === selectedModelId) || DETECTION_MODELS[0];
  }, [selectedModelId]);

  const activeConfig = useMemo(() => {
    return modelConfigs[selectedModelId] || DEFAULT_CONFIGS.speed;
  }, [modelConfigs, selectedModelId]);

  const handleConfigChange = (newConfig) => {
    setModelConfigs((prev) => ({
      ...prev,
      [selectedModelId]: newConfig,
    }));
  };

  const handleSave = () => {
    showToast(`Saved and calibrated ${activeModel.name} parameters. Propagating to edge pods...`);
  };

  const handleReset = () => {
    const defaults = DEFAULT_CONFIGS[selectedModelId];
    setModelConfigs((prev) => ({
      ...prev,
      [selectedModelId]: { ...defaults },
    }));
    showToast(`Reset ${activeModel.name} to system factory defaults.`);
  };

  const handleExportLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(modelConfigs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `detection-config-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported audit trail log to JSON.');
  };

  return (
    <div className="w-full h-full overflow-y-auto select-none bg-surface text-on-surface pb-16 font-sans">
      <div className="flex flex-col w-full max-w-[1920px] mx-auto min-w-0 p-4 sm:p-6 gap-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-cyan-950 border border-cyan-400/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce font-mono text-xs">
            <span className="material-symbols-outlined text-cyan-400 text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Header Bar */}
        <DetectionHeaderBar
          activeModelsCount={DETECTION_MODELS.length}
          edgeCluster="DOVER-NODE-04"
          latencyMs="4.2"
        />

        {/* 2. Main 3-Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Models Sub-Navigation */}
          <div className="lg:col-span-4 xl:col-span-3">
            <DetectionModulesNav
              models={DETECTION_MODELS}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
            />
          </div>

          {/* Column 2: Main Configuration Deck */}
          <div className="lg:col-span-8 xl:col-span-5">
            <DetectionConfigForm
              model={activeModel}
              config={activeConfig}
              onConfigChange={handleConfigChange}
              onSave={handleSave}
              onReset={handleReset}
            />
          </div>

          {/* Column 3: Impact Preview Sidecard */}
          <div className="lg:col-span-12 xl:col-span-4">
            <DetectionImpactPreview
              contamination={activeConfig.contamination}
            />
          </div>
        </div>

        {/* 3. Parameter Change History & Audit Trail */}
        <DetectionAuditLog onExport={handleExportLog} />
      </div>
    </div>
  );
}
