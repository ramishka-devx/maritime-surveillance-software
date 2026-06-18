import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { AlertTriangle, MapPin, Navigation, Clock } from 'lucide-react';

export function ZoneIntrusionsPanel() {
  const { token } = useAuth();
  const [intrusions, setIntrusions] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchDetections = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/restricted-areas/detections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIntrusions(data.data || []);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch zone detections:', err);
      }
    };

    // Initial fetch
    fetchDetections();

    // Poll every 10 seconds
    const interval = setInterval(fetchDetections, 10000);
    return () => clearInterval(interval);
  }, [token]);

  if (intrusions.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-[#1e2a45] p-5 h-full flex flex-col justify-center items-center shadow-md">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20">
          <AlertTriangle className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-white font-bold mb-1">No Active Intrusions</h3>
        <p className="text-sm text-slate-400 text-center">All restricted zones are clear.</p>
        {lastUpdated && (
          <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-[#1e2a45] shadow-md flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-red-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
          <h3 className="font-bold text-white">Zone Intrusions ({intrusions.length})</h3>
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
        {intrusions.map((intrusion, idx) => (
          <div key={`${intrusion.mmsi}-${idx}`} className="rounded-lg border border-red-500/20 bg-black/20 p-3 hover:bg-black/30 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-red-400">{intrusion.ship_name || 'Unknown Vessel'}</span>
                <span className="ml-2 text-xs text-slate-400 font-mono">MMSI: {intrusion.mmsi}</span>
              </div>
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                {intrusion.restricted_area_type}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-500" />
                {intrusion.restricted_zone}
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Navigation className="h-3 w-3 text-slate-500" />
                {intrusion.lat?.toFixed(4)}, {intrusion.lon?.toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
