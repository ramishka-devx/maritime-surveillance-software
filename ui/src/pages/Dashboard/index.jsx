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

  const alerts = useMemo(
    () => [
      {
        id: 1,
        title: "AIS Spoofing Detected",
        vessel: "MV Ocean Star | MMSI 563829104",
        meta: "Last seen near restricted zone | 2 min ago",
        severity: "High",
        action: "Locate",
      },
      {
        id: 2,
        title: "Loitering Behavior",
        vessel: "SS Neptune | MMSI 441208773",
        meta: "Speed < 2 knots for 18 min | 7 min ago",
        severity: "Medium",
        action: "Locate",
      },
      {
        id: 3,
        title: "Restricted Zone Violation",
        vessel: "HMS Guardian | MMSI 271998120",
        meta: "Entered Zone B-3 | 12 min ago",
        severity: "Critical",
        action: "Respond",
      },
      {
        id: 4,
        title: "Dark Vessel Detected",
        vessel: "Unknown vessel",
        meta: "Radar track without AIS | 26 min ago",
        severity: "High",
        action: "Investigate",
      },
      {
        id: 5,
        title: "Speed Anomaly",
        vessel: "SS Pacific | MMSI 538110022",
        meta: "Unusual speed change detected | 44 min ago",
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

  const priorityCount = alerts.filter((a) => ["Critical", "High"].includes(a.severity)).length;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col rounded-[22px] border border-slate-200 bg-gradient-to-br from-[#f8fbff] via-[#f4f8fc] to-[#eef4fb] text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="shrink-0 border-b border-slate-200 px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#0b74c9]">
              Live Operations
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#08244a] lg:text-[28px]">
              Maritime Command Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
              Monitor vessel movement, active risk signals, and watch floor response from one focused view.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-[420px]">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Tracked</div>
              <div className="mt-1 text-lg font-extrabold text-[#08244a]">128</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Priority</div>
              <div className="mt-1 text-lg font-extrabold text-[#0b74c9]">{priorityCount}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Uptime</div>
              <div className="mt-1 text-lg font-extrabold text-[#08244a]">98.4%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-4 lg:overflow-hidden lg:px-6 lg:py-5">
        <div className="mx-auto flex h-full min-h-[800px] max-w-[1500px] flex-col gap-4 lg:min-h-0 lg:flex-row">
          <div className="relative h-full min-h-[400px] flex-1 lg:min-h-0">
            <MapPanel />
          </div>

          <div className="h-[600px] w-full shrink-0 lg:h-full lg:w-[380px] xl:w-[420px]">
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
          assignedTo: extra.assignedTo || "-",
          resolvedBy: "-",
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
