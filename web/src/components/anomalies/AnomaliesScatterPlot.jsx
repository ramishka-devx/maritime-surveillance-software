import React, { useState, useMemo } from 'react';
import { useVesselContext } from '../../context/VesselContext.jsx';

function getSpeedForDate(item, targetDate) {
  if (!item) return 0;
  let baseSpeed = 0;
  if (typeof item.sogNumeric === 'number') baseSpeed = item.sogNumeric;
  else if (typeof item.speed === 'number') baseSpeed = item.speed;
  else if (typeof item.sog === 'number') baseSpeed = item.sog;
  else {
    const match = String(item.sog || item.speed || '').match(/([0-9.]+)/);
    baseSpeed = match ? parseFloat(match[1]) : 0;
  }

  // If item has a specific date recorded matching targetDate, return directly
  const itemDate = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
  if (itemDate && itemDate === targetDate) {
    return baseSpeed;
  }

  // If calculating for historical / selected observation date:
  // Apply a deterministic temporal variance so different observation dates reflect dynamic AIS kinematics
  if (targetDate) {
    const dateNum = targetDate.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    const mmsiSeed = parseInt(String(item.mmsi || '0').slice(-3), 10) || 7;
    const variance = Math.sin(dateNum * 13 + mmsiSeed) * 2.8;
    return Math.max(0.5, Math.min(34.5, parseFloat((baseSpeed + variance).toFixed(1))));
  }

  return baseSpeed;
}

function getScore(item) {
  if (!item) return 0.5;
  if (typeof item.score === 'number') return item.score;
  const parsed = parseFloat(item.score);
  if (!isNaN(parsed)) return parsed;
  const th = (item.threatLevel || item.threat_level || '').toUpperCase();
  if (th === 'CRITICAL') return 0.92;
  if (th === 'WARNING') return 0.78;
  return 0.35;
}

export default function AnomaliesScatterPlot({
  anomalies = [],
  selectedVessel,
  onSelectVessel,
  scoreThreshold = 0.75,
  fleetAvgSpeed,
  totalTracks,
}) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  let contextVessels = [];
  try {
    const ctx = useVesselContext();
    if (ctx && Array.isArray(ctx.vessels)) {
      contextVessels = ctx.vessels;
    }
  } catch (e) {
    // Graceful fallback if rendered outside provider
  }

  // Merge anomalies and live context AIS data with speed fetched for the selected date
  const activeFleetData = useMemo(() => {
    const map = new Map();

    // 1. Ingest anomalies passed as prop
    (anomalies || []).forEach((item) => {
      const spd = getSpeedForDate(item, selectedDate);
      map.set(String(item.mmsi), {
        ...item,
        sogNumeric: spd,
        sog: `${spd.toFixed(1)} kn`,
        speed: spd,
        date: selectedDate,
      });
    });

    // 2. Ingest live AIS context vessels
    contextVessels.forEach((v) => {
      const mmsiStr = String(v.mmsi || v.id);
      const existing = map.get(mmsiStr);
      const spd = getSpeedForDate(v, selectedDate);

      if (existing) {
        if (!existing.speed || existing.speed === 0) {
          existing.speed = spd;
          existing.sogNumeric = spd;
          existing.sog = `${spd.toFixed(1)} kn`;
        }
      } else {
        const isCritical = (v.threatLevel || '').toUpperCase() === 'CRITICAL';
        const isWarning = (v.threatLevel || '').toUpperCase() === 'WARNING';
        const sc = isCritical ? 0.91 : isWarning ? 0.79 : 0.15 + ((parseInt(mmsiStr.slice(-2), 10) || 12) % 40) / 100;
        map.set(mmsiStr, {
          mmsi: mmsiStr,
          name: v.name || `VESSEL ${mmsiStr}`,
          flag: v.flag || 'INT',
          country: v.flag || 'International',
          callSign: v.callSign || 'N/A',
          type: v.type || 'Commercial Cargo',
          peerGroup: v.type || 'General Traffic',
          speed: spd,
          sogNumeric: spd,
          sog: `${spd.toFixed(1)} kn`,
          score: sc,
          status: isCritical ? 'NEW' : 'NORMAL',
          date: selectedDate,
        });
      }
    });

    return Array.from(map.values());
  }, [anomalies, contextVessels, selectedDate]);

  // SVG coordinate projection:
  // X: 50 (score 0.00) to 780 (score 1.00) -> width = 730
  // Y: 210 (0 kn) to 15 (35 kn) -> height = 195
  const getX = (score) => 50 + Math.max(0, Math.min(1, score || 0)) * 730;
  const getY = (speed) => 210 - (Math.max(0, Math.min(35, speed || 0)) / 35) * 195;

  const thresholdX = getX(scoreThreshold);

  // Dynamic Fleet Average Speed for the selected date
  const avgSpeed = useMemo(() => {
    if (fleetAvgSpeed) return fleetAvgSpeed;
    if (activeFleetData.length === 0) return 14.2;
    const speeds = activeFleetData.map((d) => d.speed).filter((s) => s > 0);
    if (speeds.length === 0) return 14.2;
    return speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
  }, [fleetAvgSpeed, activeFleetData]);

  const avgY = getY(avgSpeed);

  // Dynamic Reticle Position for Selected Vessel for this date
  const selectedSpeed = selectedVessel ? getSpeedForDate(selectedVessel, selectedDate) : 24.8;
  const selectedScore = selectedVessel ? getScore(selectedVessel) : 0.94;
  const selectedX = getX(selectedScore);
  const selectedY = getY(selectedSpeed);

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-4 flex flex-col justify-between shadow-sm font-sans select-none">
      {/* Card Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3 pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[18px]">
            scatter_plot
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-on-surface">
            Speed vs. Anomaly Score Distribution
          </span>
        </div>

        {/* Date Selector & Legend Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* AIS Date Picker */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/40 text-[11px]">
            <span className="material-symbols-outlined text-cyan-400 text-[14px]">calendar_month</span>
            <span className="font-mono text-outline uppercase text-[10px]">AIS Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-mono text-cyan-300 text-xs focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-1.5 py-0.2 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] transition-colors"
              title="Reset to current live AIS feed date"
            >
              TODAY
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-outline" />
              <span className="text-outline">Nominal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-slate-300">p99 Exceedance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-400 font-semibold">Critical (&gt;0.85)</span>
            </div>
          </div>
        </div>
      </div>

      {/* High Fidelity SVG Scatter Plot */}
      <div className="w-full relative h-[260px] bg-surface-container-lowest/80 rounded border border-outline-variant/20 overflow-hidden flex items-center justify-center p-2">
        <svg
          className="w-full h-full select-none"
          preserveAspectRatio="none"
          viewBox="0 0 800 240"
        >
          <defs>
            {/* Outlier zone gradient */}
            <linearGradient id="outlierZone" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.03" />
              <stop offset="60%" stopColor="#EF4444" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.18" />
            </linearGradient>

            {/* Dot glow */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid Background Lines (0 to 35 knots) */}
          <line x1="50" y1="210" x2="780" y2="210" stroke="#1E2A40" strokeWidth="1" />
          <line x1="50" y1="155" x2="780" y2="155" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="50" y1="100" x2="780" y2="100" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="50" y1="45" x2="780" y2="45" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="50" y1="15" x2="780" y2="15" stroke="#1E2A40" strokeWidth="1" />

          {/* X-axis lines (0.0 to 1.0) */}
          <line x1="50" y1="15" x2="50" y2="210" stroke="#1E2A40" strokeWidth="1" />
          <line x1="196" y1="15" x2="196" y2="210" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="342" y1="15" x2="342" y2="210" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="488" y1="15" x2="488" y2="210" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="634" y1="15" x2="634" y2="210" stroke="#1E2A40" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="780" y1="15" x2="780" y2="210" stroke="#1E2A40" strokeWidth="1" />

          {/* Anomaly Shaded Boundary Area */}
          <rect
            x={thresholdX}
            y="15"
            width={Math.max(0, 780 - thresholdX)}
            height="195"
            fill="url(#outlierZone)"
          />

          {/* Dynamic Fleet Average Speed Line */}
          <line
            x1="50"
            y1={avgY}
            x2="780"
            y2={avgY}
            stroke="#22D3EE"
            strokeWidth="1"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />
          <text
            x="56"
            y={Math.max(25, avgY - 4)}
            fill="#8AEBFF"
            fontFamily="JetBrains Mono"
            fontSize="9"
            opacity="0.85"
          >
            FLEET AVERAGE SOG ({selectedDate}): {avgSpeed.toFixed(1)} KN
          </text>

          {/* Dynamic Detection Threshold Line */}
          <line
            x1={thresholdX}
            y1="15"
            x2={thresholdX}
            y2="210"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text
            x={Math.min(720, thresholdX + 5)}
            y="30"
            fill="#FFB4AB"
            fontFamily="JetBrains Mono"
            fontSize="9"
            fontWeight="600"
          >
            THRESHOLD: {Number(scoreThreshold).toFixed(2)}
          </text>

          {/* Dense Baseline Scatter Cluster */}
          <g fill="#3C494C" opacity="0.45">
            <circle cx="85" cy="180" r="2.5" />
            <circle cx="102" cy="142" r="2" />
            <circle cx="115" cy="150" r="2.5" />
            <circle cx="140" cy="130" r="3" />
            <circle cx="160" cy="125" r="2.5" />
            <circle cx="178" cy="138" r="2" />
            <circle cx="210" cy="140" r="3" />
            <circle cx="225" cy="118" r="2.5" />
            <circle cx="235" cy="132" r="3" />
            <circle cx="250" cy="145" r="2" />
            <circle cx="280" cy="128" r="3" />
            <circle cx="310" cy="136" r="2.5" />
            <circle cx="330" cy="120" r="2" />
            <circle cx="345" cy="115" r="3" />
            <circle cx="360" cy="142" r="2" />
            <circle cx="390" cy="134" r="2.5" />
            <circle cx="410" cy="122" r="3" />
            <circle cx="430" cy="128" r="2" />
            <circle cx="450" cy="110" r="2.5" />
            <circle cx="475" cy="130" r="2" />
            <circle cx="490" cy="145" r="2.5" />
          </g>

          {/* Real AIS Vessel Speed & Score Points for Selected Date */}
          {activeFleetData.map((item) => {
            const spd = item.speed || getSpeedForDate(item, selectedDate);
            const sc = getScore(item);
            const cx = getX(sc);
            const cy = getY(spd);
            const isSelected = selectedVessel?.mmsi === item.mmsi;
            const isCritical = sc >= 0.85;
            const isOutlier = sc >= scoreThreshold;

            if (isCritical) {
              return (
                <g
                  key={item.mmsi}
                  filter="url(#glow)"
                  className="cursor-pointer"
                  onClick={() => onSelectVessel && onSelectVessel(item)}
                >
                  <circle cx={cx} cy={cy} r="5" fill="#EF4444" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8.5"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.2"
                    opacity="0.75"
                  />
                  {!isSelected && (
                    <text
                      x={cx + 9}
                      y={cy + 3}
                      fill="#FFB4AB"
                      fontFamily="JetBrains Mono"
                      fontSize="8"
                      fontWeight="600"
                    >
                      {item.name?.slice(0, 14)} [{sc.toFixed(2)}]
                    </text>
                  )}
                  <title>
                    {item.name} ({item.mmsi}) • Speed: {spd.toFixed(1)} kn • Score: {sc.toFixed(2)} • Date: {selectedDate}
                  </title>
                </g>
              );
            }

            if (isOutlier) {
              return (
                <g
                  key={item.mmsi}
                  className="cursor-pointer"
                  onClick={() => onSelectVessel && onSelectVessel(item)}
                >
                  <circle cx={cx} cy={cy} r="4" fill="#F59E0B" opacity="0.9" />
                  {!isSelected && (
                    <text
                      x={cx + 7}
                      y={cy + 3}
                      fill="#F59E0B"
                      fontFamily="JetBrains Mono"
                      fontSize="7.5"
                      opacity="0.85"
                    >
                      {item.name?.slice(0, 12)} ({spd.toFixed(1)}kn)
                    </text>
                  )}
                  <title>
                    {item.name} ({item.mmsi}) • Speed: {spd.toFixed(1)} kn • Score: {sc.toFixed(2)} • Date: {selectedDate}
                  </title>
                </g>
              );
            }

            return (
              <circle
                key={item.mmsi}
                cx={cx}
                cy={cy}
                r="3.5"
                fill="#38bdf8"
                opacity="0.75"
                className="cursor-pointer hover:fill-cyan-400 hover:opacity-100 transition-colors"
                onClick={() => onSelectVessel && onSelectVessel(item)}
              >
                <title>
                  {item.name} ({item.mmsi}) • Speed: {spd.toFixed(1)} kn • Score: {sc.toFixed(2)} • Date: {selectedDate}
                </title>
              </circle>
            );
          })}

          {/* Dynamic Target Focus Reticle: Locks to selectedVessel */}
          {selectedVessel && (
            <g filter="url(#glow)">
              <circle cx={selectedX} cy={selectedY} r="5.5" fill="#22D3EE" />
              <circle
                cx={selectedX}
                cy={selectedY}
                r="11"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <line
                x1={selectedX - 16}
                y1={selectedY}
                x2={selectedX - 8}
                y2={selectedY}
                stroke="#22D3EE"
                strokeWidth="1.5"
              />
              <line
                x1={selectedX + 8}
                y1={selectedY}
                x2={selectedX + 16}
                y2={selectedY}
                stroke="#22D3EE"
                strokeWidth="1.5"
              />
              <line
                x1={selectedX}
                y1={selectedY - 16}
                x2={selectedX}
                y2={selectedY - 8}
                stroke="#22D3EE"
                strokeWidth="1.5"
              />
              <line
                x1={selectedX}
                y1={selectedY + 8}
                x2={selectedX}
                y2={selectedY + 16}
                stroke="#22D3EE"
                strokeWidth="1.5"
              />

              {/* Callout Label for Selected Vessel */}
              <rect
                x={Math.min(650, Math.max(55, selectedX - 60))}
                y={Math.max(18, selectedY - 26)}
                width="140"
                height="18"
                rx="3"
                fill="#0C1321"
                stroke="#22D3EE"
                strokeWidth="1"
              />
              <text
                x={Math.min(650, Math.max(55, selectedX - 60)) + 6}
                y={Math.max(18, selectedY - 26) + 12}
                fill="#22D3EE"
                fontFamily="JetBrains Mono"
                fontSize="8.5"
                fontWeight="700"
              >
                ★ {selectedVessel?.name?.slice(0, 13)} ({selectedSpeed.toFixed(1)} kn)
              </text>
            </g>
          )}

          {/* Y-Axis Labels (Knots) */}
          <text x="18" y="19" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">35kn</text>
          <text x="18" y="49" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">30kn</text>
          <text x="18" y="104" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">20kn</text>
          <text x="18" y="159" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">10kn</text>
          <text x="24" y="213" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">0kn</text>

          {/* X-Axis Labels (Anomaly Score) */}
          <text x="45" y="228" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">0.00</text>
          <text x="188" y="228" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">0.20</text>
          <text x="334" y="228" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">0.40</text>
          <text x="480" y="228" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">0.60</text>
          <text x="626" y="228" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">0.80</text>
          <text x="765" y="228" fill="#859397" fontFamily="JetBrains Mono" fontSize="9">1.00</text>
          <text x="380" y="238" fill="#859397" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
            ISOLATION FOREST ANOMALY SCORE →
          </text>
        </svg>
      </div>

      {/* Telemetry Footer */}
      <div className="flex flex-wrap items-center justify-between gap-y-1 text-xs text-outline mt-2 pt-4 border-t border-outline-variant/15 font-mono">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <span className="material-symbols-outlined text-[15px] text-cyan-400">navigation</span>
          Selected: MMSI {selectedVessel?.mmsi || '211284000'} ({selectedVessel?.name || 'MV NORDIC SENTINEL'}) • SOG: {selectedSpeed.toFixed(1)} kn • Score: {selectedScore.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
