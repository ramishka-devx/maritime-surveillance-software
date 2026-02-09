import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AlertsPanel from "../components/AlertsPanel";

const severityStyles = {
  Critical: {
    pill: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-500",
    icon: "⛔",
  },
  High: {
    pill: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dot: "bg-orange-500",
    icon: "⚠️",
  },
  Medium: {
    pill: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    dot: "bg-yellow-400",
    icon: "⚠️",
  },
  Low: {
    pill: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    dot: "bg-emerald-400",
    icon: "ℹ️",
  },
};

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
    []
  );


  const filteredAlerts = useMemo(() => {
    if (alertFilter === "All") return alerts;
    return alerts.filter((a) => a.severity === alertFilter);
  }, [alerts, alertFilter]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0b1220] to-[#111b2e] px-6 py-5">
      {/* Page Title Row (matches “Dashboard” bar look) */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
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

      {/* Main Grid: Map + Alerts rail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        {/* LEFT: MAP AREA */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {/* Map Header strip */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3">
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
            </div>
          </div>

          
          <div className="relative h-[72vh] min-h-[520px] bg-[#0f1a2d]">
            {/* Fake map texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_45%)]" />
            <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:60px_60px]" />

           
            <div className="absolute left-4 top-4 w-[240px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold text-white">Filters & Search</div>
                <button className="text-[10px] font-semibold text-[#9aa8c7] hover:text-white">
                  Reset
                </button>
              </div>
              <input
                placeholder="Search MMSI / Vessel"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-[#7f8db3] outline-none focus:border-[#f28c1b]/60"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip label="All" active />
                <Chip label="Risk" />
                <Chip label="AIS Off" />
                <Chip label="Zone" />
              </div>
            </div>

            
            <div className="absolute bottom-4 left-4 w-[260px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold text-white">MV Ocean Star</div>
                <span className="rounded-md border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                  Cargo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <InfoRow k="MMSI" v="563829104" />
                <InfoRow k="Speed" v="12.3 kn" />
                <InfoRow k="Course" v="SW 214°" />
                <InfoRow k="Status" v="Tracking" />
              </div>

              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10">
                  Details
                </button>
                <button className="flex-1 rounded-lg bg-[#f28c1b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d97706]">
                  Track
                </button>
              </div>
            </div>

            {/* Overlay: Legend (top-right like screenshot) */}
            <div className="absolute right-4 top-4 w-[170px] rounded-xl border border-white/10 bg-[#0b1220]/90 p-3 backdrop-blur">
              <div className="mb-2 text-xs font-bold text-white">Legend</div>
              <LegendRow label="Normal" dot="bg-emerald-400" />
              <LegendRow label="Warning" dot="bg-yellow-400" />
              <LegendRow label="Critical" dot="bg-red-500" />
              <LegendRow label="Unknown" dot="bg-slate-400" />
            </div>
          </div>
        </div>

        {/* RIGHT: ALERTS PANEL */}
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3">
            <div>
              <div className="text-sm font-bold text-white">Active Alerts</div>
              <div className="text-[11px] text-[#9aa8c7]">
                {filteredAlerts.length} showing
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] outline-none"
              >
                <option value="All">All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[72vh] min-h-[520px] overflow-y-auto p-3">
            <div className="space-y-3">
              {filteredAlerts.map((a) => {
                const s = severityStyles[a.severity] || severityStyles.Low;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${s.dot}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-white">
                              {a.title}
                            </div>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${s.pill}`}
                            >
                              {a.severity}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-[#c9d3ee]">
                            {a.vessel}
                          </div>
                          <div className="mt-1 text-[11px] text-[#7f8db3]">
                            {a.meta}
                          </div>
                        </div>
                      </div>

                      <button className="h-fit rounded-lg bg-[#f28c1b] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#d97706]">
                        {a.action}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#9aa8c7]">
                      <span className="flex items-center gap-2">
                        <span className="opacity-80">{s.icon}</span>
                        Suggested: {a.action}
                      </span>
                      <button className="font-semibold text-[#c9d3ee] hover:text-white">
                        View details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer strip */}
          <div className="border-t border-white/10 bg-white/5 px-4 py-3 text-[11px] text-[#9aa8c7]">
            Tip: Click an alert to center the map on the vessel.
          </div>
        </aside>
      </div>
    </div>
  );
};

function Chip({ label, active }) {
  return (
    <button
      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
        active
          ? "bg-[#f28c1b]/15 text-[#ffd7a8] border-[#f28c1b]/30"
          : "bg-white/5 text-[#9aa8c7] border-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function InfoRow({ k, v }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#7f8db3]">
        {k}
      </div>
      <div className="text-[11px] font-semibold text-white">{v}</div>
    </div>
  );
}

function LegendRow({ label, dot }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px] text-[#c9d3ee]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}

export default Dashboard;
