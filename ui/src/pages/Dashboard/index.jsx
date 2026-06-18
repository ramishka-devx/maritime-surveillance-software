import React, { useMemo, useState } from "react";
import { MapPanel } from "./components/MapPanel.jsx";
import { AlertsPanel } from "./components/AlertsPanel.jsx";
import { AlertDetailModal } from "../Alerts/components/AlertDetailModal.jsx";
import { useAlerts } from "../Alerts/hooks/useAlerts.js";

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

  const { alerts, resolve } = useAlerts();

  const filteredAlerts = useMemo(() => {
    if (alertFilter === "All") return alerts;
    return alerts.filter((a) => a.severity === alertFilter);
  }, [alerts, alertFilter]);

  return (
    <div className="h-screen flex flex-col bg-[#f1f5f9] rounded-2xl">
      {/* Header Section */}
     
      

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:px-6 lg:py-4 custom-scrollbar lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[800px] lg:min-h-0">
          <div className="flex-1 min-h-[400px] lg:min-h-0 h-full relative">
            <MapPanel />
          </div>

          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 h-[800px] lg:h-full">
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
          level: raw.level || SEVERITY_TO_LEVEL[raw.severity] || "info",
          when: raw.when || raw.meta,
          description: raw.description || extra.description || "",
          status: raw.status || extra.status || "Active",
          assignedTo: raw.assignedTo && raw.assignedTo !== "—" ? raw.assignedTo : (extra.assignedTo || "—"),
          resolvedBy: raw.resolvedBy || "—",
          acknowledged: raw.acknowledged || false,
          notes: raw.notes || null,
        };
        return (
          <AlertDetailModal
            alert={normalized}
            onClose={() => setSelectedAlertId(null)}
            onResolve={(id) => {
              if (resolve) resolve(id);
              setSelectedAlertId(null);
            }}
          />
        );
      })()}
    </div>
  );
};

export default Dashboard;
