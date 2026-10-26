import React, { useState } from 'react';
import DashboardHeaderBar from '../../components/dashboard/DashboardHeaderBar.jsx';
import DashboardKpiCards from '../../components/dashboard/DashboardKpiCards.jsx';
import DashboardAlertsTimeSeries from '../../components/dashboard/DashboardAlertsTimeSeries.jsx';
import DashboardAlertsByTypeDonut from '../../components/dashboard/DashboardAlertsByTypeDonut.jsx';
import DashboardTopFlaggedVessels from '../../components/dashboard/DashboardTopFlaggedVessels.jsx';
import DashboardLiveInterdictionQueue from '../../components/dashboard/DashboardLiveInterdictionQueue.jsx';
import DashboardDensityHeatmap from '../../components/dashboard/DashboardDensityHeatmap.jsx';
import { useDashboardData } from '../../hooks/useDashboardData';

function generateCsv(data) {
  const { kpis, incidentTypes = [], topFlaggedVessels = [], interdictionQueue = [] } = data;

  const lines = [];

  lines.push('KPI METRICS');
  lines.push('Metric,Value');
  lines.push(`Open Alerts,${kpis?.openAlerts?.value ?? 0}`);
  lines.push(`Critical Alerts,${kpis?.criticalAlerts?.value ?? 0}`);
  lines.push(`Active Vessels,${kpis?.activeVessels?.value ?? 0}`);
  lines.push(`Anomalies,${kpis?.anomalies?.value ?? 0}`);
  lines.push(`Incursions,${kpis?.incursions?.value ?? 0}`);
  lines.push('');

  lines.push('INCIDENT SUMMARIES');
  lines.push('Type,Count,Percentage');
  for (const t of incidentTypes) {
    lines.push(`${t.type},${t.count},${t.percentage}%`);
  }
  lines.push('');

  lines.push('TOP FLAGGED VESSELS');
  lines.push('MMSI,Vessel Name,Alert Count');
  for (const v of topFlaggedVessels) {
    lines.push(`${v.mmsi},"${v.vesselName}",${v.count}`);
  }
  lines.push('');

  lines.push('LIVE INTERDICTION QUEUE');
  lines.push('Alert ID,Title,Severity,Vessel,MMSI,Created At');
  for (const a of interdictionQueue) {
    lines.push(`${a.alertId},"${a.title}",${a.severity},${a.vesselName},${a.mmsi},${a.createdAt}`);
  }

  return lines.join('\n');
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [exportNotice, setExportNotice] = useState(false);

  const {
    kpis = {
      openAlerts: { value: 0, trend: 0 },
      criticalAlerts: { value: 0, trend: 0 },
      activeVessels: { value: 0, trend: 0 },
      anomalies: { value: 0, trend: 0 },
      incursions: { value: 0, trend: 0 },
    },
    hourlyBuckets = [],
    incidentTypes = [],
    topFlaggedVessels = [],
    interdictionQueue = [],
    sectorDensity = [],
    isLoading = false,
  } = useDashboardData(timeRange);

  const safeBuckets = Array.isArray(hourlyBuckets) ? hourlyBuckets : [];
  const openAlertsTrend = safeBuckets.map((b) => (b.critical || 0) + (b.high || 0) + (b.medium || 0) + (b.low || 0));
  const criticalAlertsTrend = safeBuckets.map((b) => b.critical || 0);
  const activeVesselsTrend = safeBuckets.map((_, i) => Math.round((Math.sin(i / 3) + 1) * 50));
  const anomaliesTrend = safeBuckets.map((b) => b.high || 0);
  const incursionsTrend = safeBuckets.map((b) => b.low || 0);

  const lastSynced = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const handleExport = () => {
    if (!kpis) return;

    const csv = generateCsv({ kpis, incidentTypes, topFlaggedVessels, interdictionQueue });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleSelectVessel = (vessel) => {
    console.log('Selected vessel:', vessel);
  };

  return (
    <div className="w-full h-full overflow-y-auto select-none bg-surface text-on-surface px-4 py-3 pb-16 font-sans">
      <div className="flex flex-col gap-6 max-w-[1920px] mx-auto pb-8">
        {exportNotice && (
          <div className="fixed top-20 right-6 z-50 bg-cyan-950 border border-cyan-400/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce font-mono text-xs">
            <span className="material-symbols-outlined text-cyan-400 text-base">check_circle</span>
            <span>Dashboard analytics telemetry report generated successfully.</span>
          </div>
        )}

        <DashboardHeaderBar
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onExportReport={handleExport}
          lastSynced={lastSynced}
        />

        <DashboardKpiCards
          openAlertsCount={kpis?.openAlerts?.value ?? 0}
          criticalAlertsCount={kpis?.criticalAlerts?.value ?? 0}
          activeVesselsCount={kpis?.activeVessels?.value ?? 0}
          anomaliesCount={kpis?.anomalies?.value ?? 0}
          incursionsCount={kpis?.incursions?.value ?? 0}
          openAlertsTrend={openAlertsTrend}
          criticalAlertsTrend={criticalAlertsTrend}
          activeVesselsTrend={activeVesselsTrend}
          anomaliesTrend={anomaliesTrend}
          incursionsTrend={incursionsTrend}
          timeRange={timeRange}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8">
            <DashboardAlertsTimeSeries hourlyBuckets={hourlyBuckets} timeRange={timeRange} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-4">
            <DashboardAlertsByTypeDonut incidentTypes={incidentTypes} timeRange={timeRange} isLoading={isLoading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4">
            <DashboardTopFlaggedVessels
              topFlaggedVessels={topFlaggedVessels}
              timeRange={timeRange}
              isLoading={isLoading}
              onSelectVessel={handleSelectVessel}
            />
          </div>
          <div className="lg:col-span-5">
            <DashboardLiveInterdictionQueue
              interdictionQueue={interdictionQueue}
              openAlertsTotal={kpis?.openAlerts?.value ?? 0}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-3">
            <DashboardDensityHeatmap sectorDensity={sectorDensity} timeRange={timeRange} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
