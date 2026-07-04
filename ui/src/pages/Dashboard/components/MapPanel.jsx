import { useState } from "react";
import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import VesselMap from "../../../components/VesselMap.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { Filter, Maximize } from "lucide-react";

export function MapPanel() {
  const { token } = useAuth();
  const [error, setError] = useState(null);

  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Maritime Map"
    >
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-800">
              Live Tactical Theater
            </h3>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-gray-600 transition-colors">
              <Filter size={18} />
            </button>
            <button className="hover:text-gray-600 transition-colors">
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Map Area */}
        <div className="relative flex-1 min-h-0 bg-[#0f1a2d] z-0 overflow-hidden">
          <VesselMap 
            token={token} 
            options={{ 
              pollInterval: 10000,
              center: [15, 20], // [lng, lat] roughly centered over Africa/Europe
              zoom: 1.5 // Zoomed out to show the world
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
