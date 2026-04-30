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
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col h-full w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 bg-gray-50 px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-[#08244a]">
              Maritime Map
            </span>
            <span className="rounded-md border border-[#0b74c9]/20 bg-[#0b74c9]/10 px-2 py-0.5 text-[10px] font-bold text-[#0b74c9]">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-gray-50 hover:text-[#0b74c9] transition-colors shadow-sm whitespace-nowrap">
              Layers
            </button>
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-gray-50 hover:text-[#0b74c9] transition-colors shadow-sm whitespace-nowrap">
              Zones
            </button>
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-gray-50 hover:text-[#0b74c9] transition-colors shadow-sm whitespace-nowrap">
              Filters
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-[300px] sm:min-h-0 bg-slate-100 w-full z-0">
          {/* Leaflet Map - Always rendered to maintain view state */}
          <MapView vessels={vessels} />

          {/* Loading Overlay - Only show on first load */}
          {isLoading && vessels.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm z-[999]">
              <div className="text-slate-800 text-sm font-semibold">Loading vessels...</div>
            </div>
          )}

          {/* Refreshing Indicator - Show during updates */}
          {isLoading && vessels.length > 0 && (
            <div className="absolute top-4 right-4 rounded-lg border border-[#0b74c9]/20 bg-[#0b74c9]/10 px-3 py-1.5 backdrop-blur z-[1001] shadow-sm">
              <span className="text-xs font-bold text-[#0b74c9]">
                Updating...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-red-200 bg-red-50/90 px-4 py-2 backdrop-blur z-[1000] shadow-md">
              <div className="text-red-600 text-xs font-semibold">Error: {error}</div>
            </div>
          )}

          {/* Vessel Count Badge */}
          {!isLoading && vessels.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-gray-200 bg-white/95 px-4 py-2 backdrop-blur z-[1000] shadow-sm">
              <span className="text-xs font-extrabold text-[#08244a]">
                {vessels.length} vessels tracked
              </span>
            </div>
          )}

          {/* Filters & Search - Top Right */}
          <div className="hidden md:block absolute right-4 top-4 w-[240px] rounded-xl border border-gray-200 bg-white/95 p-4 backdrop-blur z-10 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-extrabold text-[#08244a]">
                Filters & Search
              </div>
              <button className="text-[10px] font-bold text-[#0b74c9] hover:text-[#08244a] transition-colors">
                Reset
              </button>
            </div>
            <input
              placeholder="Search MMSI / Vessel"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0b74c9] focus:ring-2 focus:ring-[#0b74c9]/20 transition-all"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip label="All" active />
              <Chip label="Risk" />
              <Chip label="AIS Off" />
              <Chip label="Zone" />
            </div>
          </div>



          {/* Legend - Bottom Right */}
          <div className="hidden sm:block absolute right-4 bottom-4 w-[170px] rounded-xl border border-gray-200 bg-white/95 p-4 backdrop-blur z-10 shadow-lg">
            <div className="mb-3 text-xs font-extrabold text-[#08244a]">Legend</div>
            <LegendRow label="Normal" dot="bg-emerald-500" />
            <LegendRow label="Warning" dot="bg-amber-500" />
            <LegendRow label="Critical" dot="bg-red-500" />
            <LegendRow label="Unknown" dot="bg-slate-400" />
          </div>
        </div>
      </div>
    </RequestAccessGate>
  );
}
