import React, { useMemo, useState } from "react";
import { RotateCw, Maximize2 } from "lucide-react";
import { MapPanel } from "./components/MapPanel.jsx";
import { AlertsPanel } from "./components/AlertsPanel.jsx";
import { AlertDetailModal } from "../Alerts/components/AlertDetailModal.jsx";

const SEVERITY_TO_LEVEL = {
  Critical: "critical",
  High: "warning",
  Medium: "warning",
  Low: "info",
};

const DETAIL_FIELDS = {
  "AIS Spoofing Detected": {
    description: "The vessel's AIS signal has been detected with inconsistencies suggesting deliberate manipulation of broadcast data. The position reported via AIS does not match radar tracking.",
    status: "Investigating",
    assignedTo: "Watch Officer Chen",
  },
  "Loitering Behavior": {
    description: "Vessel has maintained a speed below 2 knots for an extended period in an area not designated for anchorage. This may indicate ship-to-ship transfer or waiting for instructions.",
    status: "Active",
    assignedTo: "Operator Martinez",
  },
  "Restricted Zone Violation": {
    description: "Vessel has entered a restricted maritime zone without prior authorisation. All vessels require a transit permit before entering Zone B-3.",
    status: "Investigating",
    assignedTo: "Coast Guard Unit 4",
  },
  "Dark Vessel Detected": {
    description: "A radar track has been detected for a vessel not broadcasting an AIS signal. The vessel's identity, flag state, and cargo are unknown.",
    status: "Active",
    assignedTo: "Patrol Vessel Gulf-2",
  },
  "Speed Anomaly": {
    description: "The vessel has exhibited an abrupt speed change inconsistent with normal navigation. This may indicate evasive manoeuvring or mechanical irregularities.",
    status: "Active",
    assignedTo: "Unassigned",
  },
};

const Dashboard = () => {
  const [alertFilter, setAlertFilter] = useState("All");
  const [selectedAlertId, setSelectedAlertId] = useState(null);

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
    <div className="h-screen flex flex-col bg-[#f1f5f9]">
      {/* Header Section */}
      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200 flex-shrink-0 flex items-center justify-between bg-white text-slate-800 shadow-sm z-10 relative">
        <div className="mb-0 flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-extrabold text-[#08244a]">
              Dashboard 
            </h1>
            <p className="text-xs lg:text-sm font-medium text-slate-500">
              Real-time vessel monitoring & alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <button 
            type="button"
            title="Refresh dashboard"
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 lg:px-3 py-1.5 lg:py-2 text-sm font-semibold text-slate-600 hover:bg-gray-100 hover:text-slate-900 transition-colors shadow-sm"
          >
            <RotateCw size={18} />
          </button>
          <button 
            type="button"
            title="Toggle fullscreen"
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 lg:px-3 py-1.5 lg:py-2 text-sm font-semibold text-slate-600 hover:bg-gray-100 hover:text-slate-900 transition-colors shadow-sm hidden sm:block"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:px-6 lg:py-4 custom-scrollbar lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[800px] lg:min-h-0">
          <div className="flex-1 min-h-[400px] lg:min-h-0 h-full relative">
            <MapPanel />
          </div>

          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 h-[600px] lg:h-full">
            <AlertsPanel 
              alerts={alerts}
              filteredAlerts={filteredAlerts}
              alertFilter={alertFilter}
              setAlertFilter={setAlertFilter}
              onAlertClick={(id) => setSelectedAlertId(id)}
            />
          </div>
        </div>
      </div>

      {selectedAlertId && (() => {
        const raw = alerts.find((a) => String(a.id) === String(selectedAlertId));
        if (!raw) return null;
        const extra = DETAIL_FIELDS[raw.title] || {};
        const normalized = {
          ...raw,
          level: SEVERITY_TO_LEVEL[raw.severity] || "info",
          when: raw.meta,
          description: extra.description || "",
          status: extra.status || "Active",
          assignedTo: extra.assignedTo || "—",
          resolvedBy: "—",
          acknowledged: false,
          notes: null,
        };
        return (
          <AlertDetailModal
            alert={normalized}
            onClose={() => setSelectedAlertId(null)}
          />
        );
      })()}
    </div>
  );
};

export default Dashboard;
