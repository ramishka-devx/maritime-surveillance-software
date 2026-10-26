import React, { useState, useEffect } from 'react';
import HealthHeaderBar from '../../components/health/HealthHeaderBar.jsx';
import HealthStatusCards from '../../components/health/HealthStatusCards.jsx';
import HealthThroughputLagCharts from '../../components/health/HealthThroughputLagCharts.jsx';
import HealthPartitionsTable from '../../components/health/HealthPartitionsTable.jsx';
import HealthExceptionsLog from '../../components/health/HealthExceptionsLog.jsx';

const INITIAL_PARTITIONS = [
  {
    id: 'part-1',
    name: 'ais_positions_2025_05_17',
    range: '05-17 00:00 - 23:59',
    rowCount: '158,429,104',
    size: '28.4 GB',
    status: 'Created',
  },
  {
    id: 'part-2',
    name: 'ais_positions_2025_05_18',
    range: '05-18 00:00 - 23:59',
    rowCount: '94,812,040',
    size: '16.9 GB',
    status: 'Active',
    isToday: true,
  },
  {
    id: 'part-3',
    name: 'ais_positions_2025_05_19',
    range: '05-19 00:00 - 23:59',
    rowCount: '0',
    size: '0 MB',
    status: 'Ready',
    tag: '(+1d)',
  },
  {
    id: 'part-4',
    name: 'ais_positions_2025_05_20',
    range: '05-20 00:00 - 23:59',
    rowCount: '—',
    size: '—',
    status: 'Missing',
  },
  {
    id: 'part-5',
    name: 'ais_positions_2025_05_21',
    range: '05-21 00:00 - 23:59',
    rowCount: '—',
    size: '—',
    status: 'Missing',
  },
];

export default function SystemHealthPage() {
  const [refreshInterval, setRefreshInterval] = useState('10');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [partitions, setPartitions] = useState(INITIAL_PARTITIONS);
  const [toastMessage, setToastMessage] = useState(null);

  const [metrics, setMetrics] = useState({
    ingestRate: '1,840',
    kafkaLag: '120',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Small simulated jitter
      const nextIngest = (1820 + Math.floor(Math.random() * 40)).toLocaleString();
      const nextLag = (110 + Math.floor(Math.random() * 20)).toString();
      setMetrics({ ingestRate: nextIngest, kafkaLag: nextLag });
      showToast('Telemetry diagnostics & cluster metrics updated.');
    }, 600);
  };

  // Auto-refresh interval effect
  useEffect(() => {
    const sec = parseInt(refreshInterval, 10);
    if (!sec || sec <= 0) return;

    const interval = setInterval(() => {
      const nextIngest = (1820 + Math.floor(Math.random() * 40)).toLocaleString();
      const nextLag = (110 + Math.floor(Math.random() * 20)).toString();
      setMetrics({ ingestRate: nextIngest, kafkaLag: nextLag });
    }, sec * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleCreatePartition = (partId) => {
    setPartitions((prev) =>
      prev.map((p) =>
        p.id === partId
          ? { ...p, status: 'Ready', rowCount: '0', size: '0 MB' }
          : p
      )
    );
    showToast(`Partition provisioned and registered in Postgres schema.`);
  };

  const handleRunMaintenance = () => {
    setPartitions((prev) =>
      prev.map((p) =>
        p.status === 'Missing'
          ? { ...p, status: 'Ready', rowCount: '0', size: '0 MB' }
          : p
      )
    );
    showToast('Executed partition_watch cron: all future partitions allocated.');
  };

  const handleInspectPartition = (partId) => {
    const part = partitions.find((p) => p.id === partId);
    showToast(`Inspecting table partition ${part?.name || partId}...`);
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
        <HealthHeaderBar
          uptime="99.98%"
          uptimeDuration="41d 14h 22m"
          clusterName="US-EAST-MARITIME-01"
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
          onManualRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
        />

        {/* 2. Top Row: 5 Service Health Cards */}
        <HealthStatusCards metrics={metrics} />

        {/* 3. Middle Row: Two Telemetry Charts */}
        <HealthThroughputLagCharts />

        {/* 4. Bottom Row: Database Partitions & Service Exceptions */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7">
            <HealthPartitionsTable
              partitions={partitions}
              onCreatePartition={handleCreatePartition}
              onRunMaintenance={handleRunMaintenance}
              onInspectPartition={handleInspectPartition}
            />
          </div>

          <div className="xl:col-span-5">
            <HealthExceptionsLog />
          </div>
        </section>
      </div>
    </div>
  );
}
