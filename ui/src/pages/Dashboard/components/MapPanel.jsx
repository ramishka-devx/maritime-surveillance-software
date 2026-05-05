import { useState } from "react";
import { Maximize2 } from "lucide-react";
import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import VesselMap from "../../../components/VesselMap.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";

export function MapPanel({ isFullscreen, onToggleFullscreen }) {
  const { token } = useAuth();
  const [error, setError] = useState(null);

  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Maritime Map"
    >
      <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#1B397E] shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3 flex-shrink-0">
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
            <button
              onClick={onToggleFullscreen}
              aria-pressed={isFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-[#c9d3ee] transition-colors hover:bg-white/10"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 bg-[#0f1a2d]">
          {/* MapLibre GL Map */}
          <VesselMap 
            token={token} 
            options={{ 
              pollInterval: 10000,
              center: [0, 20], // World map center
              zoom: 1          // World map zoom
            }}
            onError={(err) => setError(err.message || String(err))}
          />

          {/* Error State */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 backdrop-blur z-[1000]">
              <div className="text-red-400 text-xs">Error: {error}</div>
            </div>
          )}

        </div>
      </div>
    </RequestAccessGate>
  );
}
