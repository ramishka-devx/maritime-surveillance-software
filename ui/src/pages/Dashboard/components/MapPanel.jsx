import { useState, useEffect } from "react";
import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import MapView from "../../../components/MapView.jsx";
import { Chip } from "./FilterChip.jsx";
import { InfoRow } from "./InfoRow.jsx";
import { LegendRow } from "./LegendRow.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { getLatestVesselPositions, transformVesselData } from "../../../lib/vessels.js";

export function MapPanel() {
  const { token } = useAuth();
  const [vessels, setVessels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadVessels() {
      if (!token) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getLatestVesselPositions(token, 100);
        const transformed = transformVesselData(data);
        setVessels(transformed);
      } catch (err) {
        console.error('Failed to load vessels:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadVessels();
    
    // Optional: Refresh every 30 seconds
    const interval = setInterval(loadVessels, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Maritime Map"
    >
      <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Maritime Map
            </span>
            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Layers
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Zones
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Filters
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-[#0f1a2d]">
          {/* Leaflet Map - Always rendered to maintain view state */}
          <MapView vessels={vessels} />

          {/* Loading Overlay - Only show on first load */}
          {isLoading && vessels.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0f1a2d] z-[999]">
              <div className="text-white text-sm">Loading vessels...</div>
            </div>
          )}

          {/* Refreshing Indicator - Show during updates */}
          {isLoading && vessels.length > 0 && (
            <div className="absolute top-4 right-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 backdrop-blur z-[1001]">
              <span className="text-xs font-semibold text-emerald-300">
                Updating...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 backdrop-blur z-[1000]">
              <div className="text-red-400 text-xs">Error: {error}</div>
            </div>
          )}

          {/* Vessel Count Badge */}
          {!isLoading && vessels.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0b1220]/90 px-3 py-1.5 backdrop-blur z-[1000]">
              <span className="text-xs font-semibold text-white">
                {vessels.length} vessels tracked
              </span>
            </div>
          )}

          {/* Filters & Search - Top Right */}
          <div className="absolute right-4 top-4 w-[240px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur z-[1000]">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                Filters & Search
              </div>
              <button className="text-[10px] font-semibold text-[#9aa8c7] hover:text-white">
                Reset
              </button>
            </div>
            <input
              placeholder="Search MMSI / Vessel"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-[#7f8db3] outline-none focus:border-[#f28c1b]/60"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip label="All" active />
              <Chip label="Risk" />
              <Chip label="AIS Off" />
              <Chip label="Zone" />
            </div>
          </div>



          {/* Legend - Bottom Right */}
          <div className="absolute right-4 bottom-4 w-[170px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur z-[1000]">
            <div className="mb-2 text-xs font-bold text-white">Legend</div>
            <LegendRow label="Normal" dot="bg-emerald-400" />
            <LegendRow label="Warning" dot="bg-yellow-400" />
            <LegendRow label="Critical" dot="bg-red-500" />
            <LegendRow label="Unknown" dot="bg-slate-400" />
          </div>
        </div>
      </div>
    </RequestAccessGate>
  );
}
