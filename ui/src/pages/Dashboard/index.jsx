import React, { useMemo, useState } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);

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

  const handleToggleFullscreen = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      setIsAlertsOpen(true);
      return;
    }
    setIsFullscreen(true);
    setIsAlertsOpen(false);
  };

  const handleToggleAlerts = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      setIsAlertsOpen(true);
      return;
    }
    setIsAlertsOpen((prev) => !prev);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f1f5f9]">
      <div className="flex items-center justify-between px-4 pt-4 lg:px-6">
        <div>
          <div className="text-sm font-semibold text-slate-600">Maritime Dashboard</div>
          <div className="text-xs text-slate-400">Live situational awareness</div>
        </div>
        <button
          onClick={handleToggleAlerts}
          aria-pressed={isAlertsOpen}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          Alerts
        </button>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:px-6 lg:py-4 custom-scrollbar lg:overflow-hidden">
        <div className="relative h-full min-h-[800px] lg:min-h-0">
          <div
            className={`transition-all duration-300 ${
              isFullscreen
                ? "fixed inset-0 z-50 bg-[#0a192f] p-4"
                : `relative flex-1 min-h-[400px] lg:min-h-0 h-full ${
                    isAlertsOpen ? "lg:pr-[420px] xl:pr-[460px]" : ""
                  }`
            }`}
          >
            <MapPanel isFullscreen={isFullscreen} onToggleFullscreen={handleToggleFullscreen} />
          </div>

          {!isFullscreen && (
            <>
              {isAlertsOpen && (
                <button
                  type="button"
                  onClick={() => setIsAlertsOpen(false)}
                  aria-label="Close alerts panel"
                  className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
                />
              )}
              <div className="absolute right-0 top-0 z-40 h-full w-full lg:w-[380px] xl:w-[420px]">
                <AlertsPanel
                  filteredAlerts={filteredAlerts}
                  alertFilter={alertFilter}
                  setAlertFilter={setAlertFilter}
                  onAlertClick={(id) => setSelectedAlertId(id)}
                  isOpen={isAlertsOpen}
                />
              </div>
            </>
          )}
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
