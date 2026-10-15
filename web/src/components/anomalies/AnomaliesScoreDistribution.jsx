import React, { useMemo, useState } from 'react';
import { useVesselContext } from '../../context/VesselContext.jsx';

function extractScore(item) {
  if (!item) return 0;
  if (typeof item.score === 'number' && !isNaN(item.score)) {
    return Math.max(0, Math.min(1, item.score));
  }
  if (item.score !== undefined && item.score !== null) {
    const parsed = parseFloat(item.score);
    if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
  }
  if (typeof item.anomaly_score === 'number' && !isNaN(item.anomaly_score)) {
    return Math.max(0, Math.min(1, item.anomaly_score));
  }
  if (item.anomaly_score !== undefined && item.anomaly_score !== null) {
    const parsed = parseFloat(item.anomaly_score);
    if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
  }
  const th = String(item.threatLevel || item.threat_level || item.severity || '').toUpperCase();
  if (th === 'CRITICAL' || th === 'HIGH') return 0.92;
  if (th === 'WARNING' || th === 'MEDIUM') return 0.79;
  return 0.25;
}

const BIN_CONFIG = [
  { label: '.0-.2', min: 0.0, max: 0.2, key: 'bin-0' },
  { label: '.2-.4', min: 0.2, max: 0.4, key: 'bin-1' },
  { label: '.4-.6', min: 0.4, max: 0.6, key: 'bin-2' },
  { label: '.6-.75', min: 0.6, max: 0.75, key: 'bin-3' },
  { label: '.75-.85', min: 0.75, max: 0.85, key: 'bin-4' },
  { label: '.85-.95', min: 0.85, max: 0.95, key: 'bin-5' },
  { label: '.95-1', min: 0.95, max: 1.0001, key: 'bin-6' },
];

function getBinStyles(bin, threshold) {
  if (bin.max <= threshold) {
    if (bin.max <= 0.6) {
      return {
        color: 'bg-surface-container-highest hover:bg-outline-variant',
        textClass: 'text-outline opacity-80',
      };
    }
    return {
      color: 'bg-cyan-500/40 hover:bg-cyan-400/60',
      textClass: 'text-cyan-400/90',
    };
  }
  // At or above detection threshold
  if (bin.min >= 0.85 || bin.min >= threshold + 0.1) {
    return {
      color: 'bg-red-500 hover:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      textClass: 'text-red-400 font-bold',
    };
  }
  return {
    color: 'bg-amber-500/80 hover:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    textClass: 'text-amber-400 font-bold',
  };
}

export default function AnomaliesScoreDistribution({
  anomalies = [],
  scoreThreshold = 0.75,
  selectedVessel = null,
  peerGroup = 'ALL',
  onSelectBin = null,
}) {
  const [hoveredBin, setHoveredBin] = useState(null);

  let contextVessels = [];
  try {
    const ctx = useVesselContext();
    if (ctx && Array.isArray(ctx.vessels)) {
      contextVessels = ctx.vessels;
    }
  } catch (e) {
    // Outside provider fallback
  }

  // Active evaluated fleet
  const activeFleet = useMemo(() => {
    let list = Array.isArray(anomalies) && anomalies.length > 0 ? anomalies : [];

    if (list.length === 0 && contextVessels.length > 0) {
      list = contextVessels;
    }

    if (peerGroup && peerGroup !== 'ALL') {
      const filtered = list.filter(
        (item) => item.peerGroup === peerGroup || item.type === peerGroup
      );
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    return list;
  }, [anomalies, contextVessels, peerGroup]);

  // Extract all scores for statistical calculations
  const allScores = useMemo(() => {
    return activeFleet.map(extractScore);
  }, [activeFleet]);

  const totalEvaluated = activeFleet.length;

  // Mean score
  const meanScore = useMemo(() => {
    if (allScores.length === 0) return '0.00';
    const sum = allScores.reduce((acc, s) => acc + s, 0);
    return (sum / allScores.length).toFixed(2);
  }, [allScores]);

  // 95th Percentile (p95)
  const p95Score = useMemo(() => {
    if (allScores.length === 0) return '0.00';
    const sorted = [...allScores].sort((a, b) => a - b);
    const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    return sorted[p95Idx].toFixed(2);
  }, [allScores]);

  // Contamination Rate (proportion of critical severity tracks >= 0.85)
  const contaminationPct = useMemo(() => {
    if (allScores.length === 0) return '0.0%';
    const criticalCount = allScores.filter((s) => s >= 0.85).length;
    return `${((criticalCount / allScores.length) * 100).toFixed(1)}%`;
  }, [allScores]);

  // Outliers Rate (proportion exceeding active scoreThreshold)
  const { outliersPct, outlierCount } = useMemo(() => {
    if (allScores.length === 0) return { outliersPct: '0.0%', outlierCount: 0 };
    const count = allScores.filter((s) => s >= scoreThreshold).length;
    return {
      outliersPct: `${((count / allScores.length) * 100).toFixed(1)}%`,
      outlierCount: count,
    };
  }, [allScores, scoreThreshold]);

  // Selected vessel score
  const selectedScore = selectedVessel ? extractScore(selectedVessel) : null;

  // Compute bin counts and heights
  const binData = useMemo(() => {
    const buckets = BIN_CONFIG.map((b) => ({
      ...b,
      items: [],
    }));

    activeFleet.forEach((vessel) => {
      const score = extractScore(vessel);
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (score >= b.min && (score < b.max || (i === buckets.length - 1 && score <= b.max))) {
          b.items.push(vessel);
          break;
        }
      }
    });

    const maxCount = Math.max(...buckets.map((b) => b.items.length), 1);

    return buckets.map((b) => {
      const count = b.items.length;
      const pct = totalEvaluated > 0 ? ((count / totalEvaluated) * 100).toFixed(1) : '0.0';
      const height = count === 0 ? '4%' : `${Math.max(8, Math.round((count / maxCount) * 82))}%`;
      const isSelected =
        selectedScore !== null &&
        selectedScore >= b.min &&
        (selectedScore < b.max || (b.label === '.95-1' && selectedScore <= b.max));
      const styles = getBinStyles(b, scoreThreshold);

      return {
        ...b,
        count: count.toLocaleString(),
        rawCount: count,
        pct,
        height,
        isSelected,
        ...styles,
      };
    });
  }, [activeFleet, scoreThreshold, selectedScore, totalEvaluated]);

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-4 flex flex-col justify-between shadow-sm font-sans select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">
              bar_chart
            </span>
            <span className="text-xs font-bold uppercase tracking-wide text-on-surface">
              Score Distribution
            </span>
            {peerGroup && peerGroup !== 'ALL' && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 truncate max-w-[110px]"
                title={`Filtered to ${peerGroup}`}
              >
                {peerGroup}
              </span>
            )}
          </div>
          <span
            className="font-mono text-xs text-emerald-400 font-semibold"
            title="95th Percentile Anomaly Score across evaluated tracks"
          >
            p95: {p95Score}
          </span>
        </div>

        {/* Metrics Strip */}
        <div className="flex items-center justify-between text-xs font-mono bg-surface-container-lowest px-2.5 py-1.5 rounded border border-outline-variant/30 mb-3">
          <span className="text-outline" title="Arithmetic Mean of fleet anomaly scores">
            Mean: <span className="text-on-surface font-semibold">{meanScore}</span>
          </span>
          <span
            className="text-outline"
            title="Proportion of critical severity tracks (score >= 0.85)"
          >
            Contamination: <span className="text-cyan-400 font-semibold">{contaminationPct}</span>
          </span>
          <span
            className="text-outline"
            title={`Tracks exceeding threshold score > ${Number(scoreThreshold).toFixed(2)} (${outlierCount}/${totalEvaluated})`}
          >
            Outliers: <span className="text-red-400 font-semibold">{outliersPct}</span>
          </span>
        </div>

        {/* Histogram Bars */}
        <div className="h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 px-1">
          {binData.map((bin) => (
            <div
              key={bin.key}
              onMouseEnter={() => setHoveredBin(bin)}
              onMouseLeave={() => setHoveredBin(null)}
              onClick={() => onSelectBin && onSelectBin(bin)}
              className={`flex-1 flex flex-col items-center h-full justify-end group cursor-pointer transition-all ${
                bin.isSelected ? 'scale-105' : ''
              }`}
              title={`${bin.rawCount} vessels (${bin.pct}%) in score range ${bin.label}`}
            >
              {/* Selected vessel indicator */}
              {bin.isSelected && (
                <span
                  className="material-symbols-outlined text-cyan-400 text-[12px] animate-bounce -mb-0.5"
                  title={`Selected vessel (${selectedVessel?.name}) falls in this score bin`}
                >
                  arrow_drop_down
                </span>
              )}

              <span
                className={`font-mono text-[9px] mb-1 leading-none ${
                  bin.isSelected
                    ? 'text-cyan-300 font-bold'
                    : bin.textClass || 'text-outline opacity-80'
                }`}
              >
                {bin.count}
              </span>
              <div
                className={`w-full rounded-t transition-all ${bin.color} ${
                  bin.isSelected
                    ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#0b1220] brightness-125'
                    : ''
                }`}
                style={{ height: bin.height }}
              />
              <span
                className={`font-mono text-[9px] mt-1.5 leading-none ${
                  bin.isSelected
                    ? 'text-cyan-300 font-bold'
                    : bin.textClass
                    ? bin.textClass.replace('font-bold', 'font-semibold')
                    : 'text-outline'
                }`}
              >
                {bin.label}
              </span>
            </div>
          ))}
        </div>

        {/* Hover / Selection Detail Ribbon */}
        {hoveredBin ? (
          <div className="mt-1 px-2 py-1 bg-surface-container-lowest rounded border border-outline-variant/30 text-[10px] font-mono flex items-center justify-between text-outline">
            <span>
              Range <strong className="text-cyan-400">{hoveredBin.label}</strong>:
            </span>
            <span>
              <strong className="text-white">{hoveredBin.count}</strong> tracks ({hoveredBin.pct}%)
            </span>
          </div>
        ) : selectedVessel ? (
          <div className="mt-1 px-2 py-1 bg-surface-container-lowest rounded border border-outline-variant/30 text-[10px] font-mono flex items-center justify-between text-outline">
            <span className="truncate max-w-[180px]">
              Target: <strong className="text-cyan-400">{selectedVessel.name || selectedVessel.mmsi}</strong>
            </span>
            <span>
              Score: <strong className="text-amber-400">{(selectedScore || 0).toFixed(2)}</strong>
            </span>
          </div>
        ) : (
          <div className="mt-1 px-2 py-1 bg-surface-container-lowest/40 rounded border border-outline-variant/20 text-[10px] font-mono flex items-center justify-between text-outline/60">
            <span>Evaluated Fleet Population:</span>
            <span>{totalEvaluated} live tracks</span>
          </div>
        )}
      </div>

      {/* Histogram Footer Attribution */}
      <div className="mt-3 pt-2 border-t border-outline-variant/20 flex flex-col gap-1 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-outline">Algorithm Baseline:</span>
          <span className="text-slate-300">iForest ({totalEvaluated} tracks · 100 Trees)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-outline">Detection Threshold:</span>
          <span className="text-cyan-400 font-bold">score &gt; {Number(scoreThreshold).toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

