import React from 'react';

function Sparkline({ points = [], colorClass }) {
  const safePoints = Array.isArray(points) && points.length > 0 ? points : [0, 0];
  const max = Math.max(...safePoints, 1);
  const min = Math.min(...safePoints, 0);
  const range = max - min || 1;
  const stepX = 60 / (safePoints.length - 1 || 1);
  const polylinePoints = safePoints
    .map((p, i) => `${(i * stepX).toFixed(1)},${(25 - ((p - min) / range) * 22 - 1.5).toFixed(1)}`)
    .join(' ');

  return (
    <svg className={`w-16 h-7 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 60 25">
      <polyline points={polylinePoints} />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between p-3.5 bg-surface-container-low rounded-lg shadow-sm relative overflow-hidden border border-outline-variant/30 animate-pulse">
      <div className="h-4 w-20 bg-surface-container-highest rounded" />
      <div className="flex items-baseline justify-between mt-2">
        <div className="h-7 w-12 bg-surface-container-highest rounded" />
        <div className="h-7 w-16 bg-surface-container-highest rounded" />
      </div>
      <div className="mt-2 pt-2 -mx-3.5 -mb-3.5 px-3.5 py-1.5 border-t border-outline-variant/20">
        <div className="h-3 w-28 bg-surface-container-lowest rounded" />
      </div>
    </div>
  );
}

export default function DashboardKpiCards({
  openAlertsCount = 0,
  criticalAlertsCount = 0,
  activeVesselsCount = 0,
  anomaliesCount = 0,
  incursionsCount = 0,
  openAlertsTrend = [],
  criticalAlertsTrend = [],
  activeVesselsTrend = [],
  anomaliesTrend = [],
  incursionsTrend = [],
  timeRange = '24h',
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-sans select-none">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const rangeUpper = timeRange.toUpperCase();
  const cards = [
    {
      label: 'Open Alerts',
      value: openAlertsCount,
      colorClass: 'text-on-surface',
      badge: '+12% vs 24h',
      badgeClass: 'bg-surface-container-highest text-cyan-300',
      sparklineData: openAlertsTrend,
      sparklineColor: 'text-cyan-400',
      footerIcon: null,
      footerText: `${criticalAlertsCount} require supervisor escalation`,
      footerColor: 'text-red-500',
      dotClass: 'bg-red-500',
    },
    {
      label: 'Critical Alerts',
      value: criticalAlertsCount,
      colorClass: 'text-red-400',
      badge: '-1 vs yday',
      badgeClass: 'bg-red-950/80 text-red-400 border border-red-500/40',
      sparklineData: criticalAlertsTrend,
      sparklineColor: 'text-red-400',
      footerIcon: 'warning',
      footerText: 'Active geofence & transponder breaches',
      footerColor: 'text-red-400',
      dotClass: null,
      pulseDot: true,
    },
    {
      label: 'Active Vessels',
      value: activeVesselsCount.toLocaleString(),
      colorClass: 'text-cyan-400',
      badge: '+4.2% vol',
      badgeClass: 'bg-surface-container-highest text-cyan-400',
      sparklineData: activeVesselsTrend,
      sparklineColor: 'text-cyan-400',
      footerIcon: 'directions_boat',
      footerText: 'Dover & Channel shipping corridor',
      footerColor: 'text-cyan-400',
      dotClass: null,
    },
    {
      label: 'Anomalies Today',
      value: anomaliesCount,
      colorClass: 'text-emerald-400',
      badge: '+18 flagged',
      badgeClass: 'bg-surface-container-highest text-emerald-400',
      sparklineData: anomaliesTrend,
      sparklineColor: 'text-emerald-400',
      footerIcon: 'check_circle',
      footerText: 'Isolation forest score >= 0.75',
      footerColor: 'text-emerald-400',
      dotClass: null,
    },
    {
      label: 'Incursions',
      value: incursionsCount,
      colorClass: 'text-purple-400',
      badge: 'Live',
      badgeClass: 'bg-surface-container-highest text-purple-300',
      sparklineData: incursionsTrend,
      sparklineColor: 'text-purple-400',
      footerIcon: 'fence',
      footerText: 'Restricted area detections',
      footerColor: 'text-cyan-400',
      dotClass: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-sans select-none">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex flex-col justify-between p-3.5 bg-surface-container-low rounded-lg shadow-sm relative overflow-hidden border ${
            card.label.includes('Critical') ? 'border-red-500/30' : 'border-outline-variant/30'
          }`}
        >
          <div className="flex items-start justify-between">
            <span
              className={`font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1 ${
                card.label.includes('Critical') ? 'text-red-400' : 'text-outline'
              }`}
            >
              {card.pulseDot && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
              {card.label}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`font-mono text-2xl font-bold leading-none ${card.colorClass}`}>
              {card.value}
            </span>
            <Sparkline points={card.sparklineData} colorClass={card.sparklineColor} />
          </div>
        </div>
      ))}
    </div>
  );
}
