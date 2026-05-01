import { useState, useEffect } from "react";
import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import VesselMap from "../../../components/VesselMap.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { getRestrictedAreas, createRestrictedArea } from "../../../lib/restrictedAreas.js";
import { Plus, Check, X } from "lucide-react";

export function MapPanel() {
  const { token } = useAuth();
  const [error, setError] = useState(null);
  
  // Restricted Areas State
  const [showRestrictedAreas, setShowRestrictedAreas] = useState(false);
  const [restrictedAreas, setRestrictedAreas] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);

  useEffect(() => {
    if (showRestrictedAreas) {
      fetchRestrictedAreas();
    }
  }, [showRestrictedAreas, token]);

  const fetchRestrictedAreas = async () => {
    try {
      const data = await getRestrictedAreas(token);
      setRestrictedAreas(data || []);
    } catch (err) {
      setError("Failed to fetch restricted areas: " + err.message);
    }
  };

  const handleAddPoint = (point) => {
    setDrawPoints(prev => [...prev, point]);
  };

  const handleCreateArea = () => {
    setIsDrawing(true);
    setDrawPoints([]);
    setShowRestrictedAreas(true);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setDrawPoints([]);
  };

  const handleDoneDrawing = async () => {
    if (drawPoints.length < 3) {
      setError("At least 3 points are required to create an area");
      return;
    }
    
    try {
      const name = `Restricted Area ${restrictedAreas.length + 1}`;
      await createRestrictedArea(token, {
        name,
        type: "restricted",
        coordinates: drawPoints
      });
      
      setIsDrawing(false);
      setDrawPoints([]);
      fetchRestrictedAreas();
    } catch (err) {
      setError("Failed to create restricted area: " + err.message);
    }
  };

  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Maritime Map"
    >
      <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col h-full">
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
            <button 
              onClick={() => setShowRestrictedAreas(!showRestrictedAreas)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                showRestrictedAreas 
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" 
                  : "border-white/10 bg-white/5 text-[#c9d3ee] hover:bg-white/10"
              }`}
            >
              Restricted Areas
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Filters
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
            restrictedAreas={restrictedAreas}
            showRestrictedAreas={showRestrictedAreas}
            isDrawing={isDrawing}
            drawPoints={drawPoints}
            onDrawPoint={handleAddPoint}
          />

          {/* Map Controls */}
          {showRestrictedAreas && !isDrawing && (
            <div className="absolute bottom-6 right-6 flex gap-2">
              <button 
                onClick={handleCreateArea}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={18} />
                Create Area
              </button>
            </div>
          )}

          {isDrawing && (
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
              <div className="rounded-lg bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-xs text-white">
                Click on the map to mark points ({drawPoints.length} points)
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCancelDrawing}
                  className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 transition-all"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button 
                  onClick={handleDoneDrawing}
                  disabled={drawPoints.length < 3}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
                    drawPoints.length < 3 
                      ? "bg-emerald-600/40 cursor-not-allowed opacity-50" 
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  }`}
                >
                  <Check size={18} />
                  Done
                </button>
              </div>
            </div>
          )}

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
