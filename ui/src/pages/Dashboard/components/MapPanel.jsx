import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCw } from "lucide-react";
import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import MapView from "../../../components/MapView.jsx";
import { Chip } from "./FilterChip.jsx";
import { LegendRow } from "./LegendRow.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { getLatestVesselPositions, transformVesselData } from "../../../lib/vessels.js";

export function MapPanel() {
  const { token } = useAuth();
  const panelRef = useRef(null);
  const [vessels, setVessels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadVessels = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getLatestVesselPositions(token, 100);
      const transformed = transformVesselData(data);
      setVessels(transformed);
    } catch (err) {
      console.error("Failed to load vessels:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadVessels();

    const interval = setInterval(loadVessels, 30000);
    return () => clearInterval(interval);
  }, [loadVessels]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFullscreenToggle = async () => {
    try {
      if (document.fullscreenElement === panelRef.current) {
        await document.exitFullscreen();
        return;
      }

      await panelRef.current?.requestFullscreen();
    } catch (err) {
      console.error("Failed to toggle fullscreen:", err);
      setError("Fullscreen mode is not available right now.");
    }
  };

  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Maritime Map"
    >
      <div
        ref={panelRef}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
      >
        <div className="flex flex-shrink-0 flex-col items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-[#08244a]">
              Maritime Map
            </span>
            <span className="rounded-md border border-emerald-400/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              LIVE
            </span>
          </div>

          <div className="hide-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            <button
              type="button"
              onClick={loadVessels}
              disabled={isLoading}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#0b74c9]/35 hover:text-[#0b74c9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleFullscreenToggle}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#0b74c9]/35 hover:text-[#0b74c9]"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
            
            <button className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#0b74c9]/35 hover:text-[#0b74c9]">
              Filters
            </button>
          </div>
        </div>

        <div className="relative z-0 min-h-[300px] w-full flex-1 bg-slate-100 sm:min-h-0">
          {/* Leaflet Map - Always rendered to maintain view state */}
          <MapView vessels={vessels} />

          {/* Loading Overlay - Only show on first load */}
          {isLoading && vessels.length === 0 && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-slate-100/85 backdrop-blur-sm">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">Loading vessels...</div>
            </div>
          )}

          {/* Refreshing Indicator - Show during updates */}
          {isLoading && vessels.length > 0 && (
            <div className="absolute right-4 top-4 z-[1001] rounded-lg border border-[#0b74c9]/20 bg-[#0b74c9]/10 px-3 py-1.5 shadow-sm backdrop-blur">
              <span className="text-xs font-bold text-[#0b74c9]">
                Updating...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50/95 px-4 py-2 shadow-md backdrop-blur">
              <div className="text-xs font-semibold text-red-600">Error: {error}</div>
            </div>
          )}

          {/* Vessel Count Badge */}
          {!isLoading && vessels.length > 0 && (
            <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-lg border border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
              <span className="text-xs font-extrabold text-[#08244a]">
                {vessels.length} vessels tracked
              </span>
            </div>
          )}

          {/* Filters & Search - Top Right */}
          <div className="absolute right-4 top-4 z-10 hidden w-[240px] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md md:block">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-extrabold text-[#08244a]">
                Filters & Search
              </div>
              <button className="text-[10px] font-bold text-[#0b74c9] transition-colors hover:text-[#08244a]">
                Reset
              </button>
            </div>
            <input
              placeholder="Search MMSI / Vessel"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b74c9] focus:ring-2 focus:ring-[#0b74c9]/20"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip label="All" active />
              <Chip label="Risk" />
              <Chip label="AIS Off" />
              <Chip label="Zone" />
            </div>
          </div>



          {/* Legend - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-10 hidden w-[170px] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:block">
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
