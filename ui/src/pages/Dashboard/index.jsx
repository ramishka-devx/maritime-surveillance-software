import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { id } = useParams();
  const navigate = useNavigate();
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
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-nav-bg to-nav-bg-soft">
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-accent-orange">
              Dashboard 
            </h1>
            <p className="text-xs font-semibold text-text-muted">
              Real-time vessel monitoring & alerts
            </p>
          </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            title="Refresh dashboard"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10 transition-colors"
          >
            <RotateCw size={16} />
          </button>
          <button 
            type="button"
            title="Toggle fullscreen"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10 transition-colors"
          >
            <Maximize2 size={16} />
          </button>
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

      {id && (() => {
        const raw = alerts.find((a) => String(a.id) === String(id));
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
            onClose={() => navigate("/", { replace: true })}
          />
        );
      })()}
    </div>
  );
};

export default Dashboard;
