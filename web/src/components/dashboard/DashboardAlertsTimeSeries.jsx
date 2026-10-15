import React, { useMemo } from 'react';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];
const SEVERITY_COLORS = { critical: '#ef4444', high: '#c084fc', medium: '#22d3ee', low: '#34d399' };

export default function DashboardAlertsTimeSeries({ hourlyBuckets = [], timeRange = '24h', isLoading = false }) {
  const chartData = useMemo(() => {
    if (!hourlyBuckets.length) return null;

    const totals = { critical: 0, high: 0, medium: 0, low: 0 };
    let maxTotal = 0;
    let peakHour = hourlyBuckets[0];
    let peakTotal = 0;

    for (const bucket of hourlyBuckets) {
      for (const sev of SEVERITY_ORDER) {
        totals[sev] += bucket[sev] || 0;
      }
      const bucketTotal = SEVERITY_ORDER.reduce((sum, sev) => sum + (bucket[sev] || 0), 0);
      if (bucketTotal > peakTotal) {
        peakTotal = bucketTotal;
        peakHour = bucket;
      }
      maxTotal = Math.max(maxTotal, bucketTotal);
    }

    return { totals, maxTotal: Math.max(maxTotal, 1), peakHour, peakTotal };
  }, [hourlyBuckets]);

  if (isLoading || !chartData) {
    return (
      <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none animate-pulse">
        <div className="h-6 w-48 bg-surface-container-highest rounded mb-4" />
        <div className="h-56 w-full bg-surface-container-highest rounded" />
      </div>
    );
  }

  const chartHeight = 172;
  const barAreaTop = 20;
  const barMaxHeight = chartHeight - barAreaTop - 10;

  const peakHour = chartData?.peakHour;
  let peakDateText = '';
  if (peakHour) {
    if (timeRange === '24h') {
      peakDateText = `${new Date(peakHour.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} UTC`;
    } else {
      peakDateText = new Date(peakHour.hour).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
    }
  }

  const peakLabel =
    peakHour && chartData?.peakTotal > 0
      ? `${peakDateText} PEAK: ${chartData.peakTotal} ALERTS`
      : `No alerts in last ${timeRange.toUpperCase()}`;

  const numBuckets = hourlyBuckets.length || 1;
  const leftMargin = 45;
  const rightMargin = 20;
  const totalChartWidth = 800;
  const availableWidth = totalChartWidth - leftMargin - rightMargin;
  const stepX = availableWidth / numBuckets;
  const barWidth = Math.max(8, Math.min(50, Math.floor(stepX * 0.65)));

  return (
    <div className="flex flex-col bg-surface-container-low p-4 rounded-lg shadow-sm border border-outline-variant/30 font-sans select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 bg-surface-container-lowest/50 -mx-4 -mt-4 p-4 rounded-t-lg border-b border-outline-variant/20">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">
            stacked_bar_chart
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface uppercase">
              Alerts Over Time
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {SEVERITY_ORDER.map((sev) => (
            <span
              key={sev}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
              {sev === 'medium' ? 'Med' : sev.charAt(0).toUpperCase() + sev.slice(1)}: {chartData.totals[sev]}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full mt-3 relative">
        <div className="absolute right-6 top-2 bg-surface-container-highest px-2 py-1 rounded shadow text-cyan-400 font-mono text-xs flex items-center gap-1 pointer-events-none z-10 border border-cyan-400/30">
          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          <span>{peakLabel}</span>
        </div>

        <svg className="w-full h-56" preserveAspectRatio="none" viewBox="0 0 800 220">
          {[0, 1, 2, 3].map((i) => {
            const y = barAreaTop + (i / 3) * barMaxHeight;
            const value = Math.round(chartData.maxTotal * (1 - i / 3));
            return (
              <React.Fragment key={i}>
                <line x1="40" y1={y} x2="780" y2={y} stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 4" />
                <text x="25" y={y + 4} textAnchor="end" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">
                  {value}
                </text>
              </React.Fragment>
            );
          })}

          {hourlyBuckets.map((bucket, i) => {
            const x = leftMargin + i * stepX + (stepX - barWidth) / 2;
            let yOffset = chartHeight;
            const bars = [];

            for (const sev of ['low', 'medium', 'high', 'critical']) {
              const count = bucket[sev] || 0;
              if (count === 0) continue;
              const barHeight = (count / chartData.maxTotal) * barMaxHeight;
              yOffset -= barHeight;
              bars.push(
                <rect
                  key={sev}
                  x={x}
                  y={yOffset}
                  width={barWidth}
                  height={barHeight}
                  rx="1"
                  fill={SEVERITY_COLORS[sev]}
                />
              );
            }

            return <React.Fragment key={i}>{bars}</React.Fragment>;
          })}

          <line x1="40" y1={chartHeight} x2="780" y2={chartHeight} stroke="#3C494C" strokeWidth="1" />

          {hourlyBuckets.map((bucket, i) => {
            let shouldShow = false;
            if (numBuckets <= 7) shouldShow = true;
            else if (numBuckets <= 14) shouldShow = i % 2 === 0;
            else if (numBuckets <= 24) shouldShow = i % 3 === 0 || i === numBuckets - 1;
            else shouldShow = i % 5 === 0 || i === numBuckets - 1;

            if (!shouldShow) return null;

            const x = leftMargin + i * stepX + stepX / 2;
            const label =
              timeRange === '24h'
                ? new Date(bucket.hour).toLocaleTimeString([], { hour: '2-digit', hour12: false }) + 'Z'
                : new Date(bucket.hour).toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <text key={i} x={x} y="190" textAnchor="middle" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-outline font-mono text-xs px-1 mt-1">
        <span>Timeline standard: {timeRange.toUpperCase()}</span>
        <span className="text-cyan-400">Auto-refresh: 30s</span>
      </div>
    </div>
  );
}
