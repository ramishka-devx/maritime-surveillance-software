import React, { useMemo, useState } from "react";
import { MapPanel } from "./components/MapPanel.jsx";
import { AlertsPanel } from "./components/AlertsPanel.jsx";

const Dashboard = () => {
  const [alertFilter, setAlertFilter] = useState("All");

  const alerts = useMemo(
    () => [
      {
        id: 1,
        title: "AIS Spoofing Detected",
        vessel: "MV Ocean Star • MMSI 563829104",
        meta: "Last seen near restricted zone • 2 min ago",
        severity: "High",
        action: "Locate",
      },
      {
        id: 2,
        title: "Loitering Behavior",
        vessel: "SS Neptune • MMSI 441208773",
        meta: "Speed < 2 knots for 18 min • 7 min ago",
        severity: "Medium",
        action: "Locate",
      },
      {
        id: 3,
        title: "Restricted Zone Violation",
        vessel: "HMS Guardian • MMSI 271998120",
        meta: "Entered Zone B-3 • 12 min ago",
        severity: "Critical",
        action: "Respond",
      },
      {
        id: 4,
        title: "Dark Vessel Detected",
        vessel: "Unknown vessel",
        meta: "Radar track without AIS • 26 min ago",
        severity: "High",
        action: "Investigate",
      },
      {
        id: 5,
        title: "Speed Anomaly",
        vessel: "SS Pacific • MMSI 538110022",
        meta: "Unusual speed change detected • 44 min ago",
        severity: "Low",
        action: "View",
      },
    ],
    [],
  );

  const filteredAlerts = useMemo(() => {
    if (alertFilter === "All") return alerts;
    return alerts.filter((a) => a.severity === alertFilter);
  }, [alerts, alertFilter]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-[#0b1220] to-[#111b2e]">
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              Dashboard 
            </h1>
            <p className="text-xs text-[#9aa8c7]">
              Real-time vessel monitoring & alerts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Refresh
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
              Fullscreen
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="gap-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] h-full">
          <MapPanel />

          <AlertsPanel 
            alerts={alerts}
            filteredAlerts={filteredAlerts}
            alertFilter={alertFilter}
            setAlertFilter={setAlertFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
