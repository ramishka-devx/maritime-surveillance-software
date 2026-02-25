import React, { useEffect, useMemo, useRef, useState } from "react";

const SEVERITY = {
  critical: {
    label: "Critical",
    dot: "bg-red-400",
    pill: "bg-red-500/15 text-red-200 border-red-400/25",
    icon: "⛔",
    actionBg: "bg-red-500 hover:bg-red-600",
  },
  warning: {
    label: "Warning",
    dot: "bg-amber-300",
    pill: "bg-amber-500/15 text-amber-200 border-amber-400/25",
    icon: "⚠️",
    actionBg: "bg-accent-orange hover:bg-[#d97706]",
  },
  info: {
    label: "Info",
    dot: "bg-sky-300",
    pill: "bg-sky-500/15 text-sky-200 border-sky-400/25",
    icon: "ℹ️",
    actionBg: "bg-primary-blue hover:bg-[#1f3570]",
  },
};

const STATUS = {
  Active: {
    pill: "bg-red-500/10 text-red-200 border-red-400/20",
    dot: "bg-red-400",
  },
  Investigating: {
    pill: "bg-amber-500/10 text-amber-200 border-amber-400/20",
    dot: "bg-amber-300",
  },
  Resolved: {
    pill: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
    dot: "bg-emerald-400",
  },
};

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export default function AlertsPanel({
  onSelectAlert,
  onLocateAlert,
  enableSimulation = false,
  className = "",
}) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [alerts, setAlerts] = useState(() => [
    {
      id: "a1",
      title: "AIS Spoofing Detected",
      level: "critical",
      status: "Active",
      vessel: "MV Ocean Star",
      mmsi: "563829104",
      meta: "Last seen near restricted zone",
      when: "2m ago",
      notes: "Vessel identified and tracked. Local authorities notified.",
      assignedTo: "—",
      acknowledged: false,
      unread: true,
      vesselId: "v1",
      action: "Respond",
    },
    {
      id: "a2",
      title: "Loitering Behavior",
      level: "warning",
      status: "Investigating",
      vessel: "SS Neptune",
      mmsi: "441208773",
      meta: "Speed < 2 knots for 18 min",
      when: "7m ago",
      notes: "Possible rendezvous. Monitoring for route deviation.",
      assignedTo: "Operator 2",
      acknowledged: true,
      unread: false,
      vesselId: "v2",
      action: "Locate",
    },
    {
      id: "a3",
      title: "Restricted Zone Violation",
      level: "critical",
      status: "Investigating",
      vessel: "HMS Guardian",
      mmsi: "271998120",
      meta: "Entered Zone B-3",
      when: "12m ago",
      notes: "Zone breach confirmed. Dispatch decision pending.",
      assignedTo: "Operator 1",
      acknowledged: false,
      unread: true,
      vesselId: "v3",
      action: "Respond",
    },
    {
      id: "a4",
      title: "Dark Vessel Detected",
      level: "warning",
      status: "Active",
      vessel: "Unknown vessel",
      mmsi: "—",
      meta: "Radar track without AIS",
      when: "26m ago",
      notes: "Sensor correlation required. Attempt EO/IR verification.",
      assignedTo: "—",
      acknowledged: false,
      unread: true,
      vesselId: "v4",
      action: "Investigate",
    },
    {
      id: "a5",
      title: "Speed Anomaly",
      level: "info",
      status: "Resolved",
      vessel: "SS Pacific",
      mmsi: "538110022",
      meta: "Unusual speed change detected",
      when: "44m ago",
      notes: "Routine patrol operations confirmed. False positive.",
      assignedTo: "Operator 3",
      acknowledged: true,
      unread: false,
      vesselId: "v5",
      action: "View",
    },
  ]);

  const simCounterRef = useRef(100);
  useEffect(() => {
    if (!enableSimulation) return;

    const candidates = [
      {
        title: "Geofence Proximity",
        level: "info",
        status: "Active",
        vessel: "MV Seabird",
        mmsi: "412009331",
        meta: "Approaching Zone A-2 boundary",
        notes: "Monitor for entry; notify if crossing threshold.",
        action: "Locate",
        vesselId: "v6",
      },
      {
        title: "AIS Dropout",
        level: "warning",
        status: "Active",
        vessel: "TS Meridian",
        mmsi: "566210772",
        meta: "AIS signal lost for 6 minutes",
        notes: "Attempt radar correlation and identify track.",
        action: "Investigate",
        vesselId: "v7",
      },
      {
        title: "Restricted Zone Entry",
        level: "critical",
        status: "Active",
        vessel: "Unknown vessel",
        mmsi: "—",
        meta: "Entered Zone C-1",
        notes: "Immediate response recommended. Verify via sensors.",
        action: "Respond",
        vesselId: "v8",
      },
    ];

    const t = setInterval(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      simCounterRef.current += 1;

      const newAlert = {
        id: `a${simCounterRef.current}`,
        ...pick,
        when: "Just now",
        assignedTo: "—",
        acknowledged: false,
        unread: true,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 30));
    }, 9000);

    return () => clearInterval(t);
  }, [enableSimulation]);

  const unreadCount = useMemo(
    () => alerts.reduce((acc, a) => acc + (a.unread ? 1 : 0), 0),
    [alerts]
  );

  const activeCount = useMemo(
    () => alerts.reduce((acc, a) => acc + (a.status === "Active" ? 1 : 0), 0),
    [alerts]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);

    return alerts.filter((a) => {
      const sevOk = severityFilter === "all" ? true : a.level === severityFilter;
      const statusOk = statusFilter === "All" ? true : a.status === statusFilter;

      const hay = normalize(
        `${a.title} ${a.vessel} ${a.mmsi} ${a.meta} ${a.status} ${a.level} ${a.assignedTo}`
      );

      const qOk = q.length === 0 ? true : hay.includes(q);

      return sevOk && statusOk && qOk;
    });
  }, [alerts, severityFilter, statusFilter, query]);

  const markRead = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, unread: false } : a)));
  };

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
    markRead(id);
  };

  const acknowledge = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, acknowledged: true, unread: false, status: a.status === "Resolved" ? "Resolved" : a.status }
          : a
      )
    );
  };

  const resolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Resolved", acknowledged: true, unread: false } : a))
    );
  };

  const assignTo = (id, name) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, assignedTo: name, unread: false } : a)));
  };

  const handleLocate = (alert) => {
    markRead(alert.id);
    onLocateAlert?.(alert);
  };

  const handleSelect = (alert) => {
    markRead(alert.id);
    onSelectAlert?.(alert);
  };

  return (
    <aside
      className={[
        "w-80 overflow-hidden rounded-2xl",
        "border border-white/10 bg-[#0b1220]",
        "shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-extrabold text-white">Active Alerts</div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent-orange px-2 py-0.5 text-[10px] font-extrabold text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-text-muted">
            {filtered.length} showing • {activeCount} active
          </div>
        </div>

        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-extrabold text-white/90">
          LIVE
        </span>
      </div>

      <div className="px-3 pt-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="flex items-center gap-2">
            <span className="text-white/80">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, vessel, MMSI, status..."
              className="w-full bg-transparent text-xs font-semibold text-white placeholder:text-text-muted outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-extrabold text-white/80 hover:bg-white/10"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <Tab label="All" active={severityFilter === "all"} onClick={() => setSeverityFilter("all")} />
            <Tab label="Critical" active={severityFilter === "critical"} onClick={() => setSeverityFilter("critical")} />
            <Tab label="Warning" active={severityFilter === "warning"} onClick={() => setSeverityFilter("warning")} />
            <Tab label="Info" active={severityFilter === "info"} onClick={() => setSeverityFilter("info")} />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-extrabold text-white/90 outline-none"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="max-h-[calc(100vh-290px)] overflow-y-auto p-3">
        <div className="space-y-3">
          {filtered.map((a) => {
            const s = SEVERITY[a.level] || SEVERITY.info;
            const st = STATUS[a.status] || STATUS.Active;
            const expanded = expandedId === a.id;

            return (
              <div
                key={a.id}
                className={[
                  "rounded-xl border border-white/10 bg-white/5 p-3 transition",
                  "hover:bg-white/10",
                  a.unread ? "ring-1 ring-accent-orange/25" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpand(a.id);
                      handleSelect(a);
                    }}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {a.unread && <span className="h-2 w-2 rounded-full bg-accent-orange" />}
                        <span className="text-xs font-extrabold text-white">{a.title}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${s.pill}`}>{s.label}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${st.pill}`}>{a.status}</span>
                      </div>

                      <div className="mt-1 truncate text-[11px] font-semibold text-white/85">
                        {a.vessel} {a.mmsi !== "—" ? `• MMSI ${a.mmsi}` : ""}
                      </div>

                      <div className="mt-1 text-[11px] text-text-muted">
                        {a.meta} • {a.when}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLocate(a)}
                    className={[
                      "shrink-0 rounded-lg px-3 py-2 text-[11px] font-extrabold text-white",
                      "shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition",
                      s.actionBg,
                    ].join(" ")}
                    title="Locate on map"
                  >
                    {a.action}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-text-muted">
                  <span className="flex items-center gap-2">
                    <span className="opacity-90">{s.icon}</span>
                    Assigned: <span className="text-white/80">{a.assignedTo}</span>
                  </span>

                  <button type="button" onClick={() => toggleExpand(a.id)} className="text-white/80 hover:text-white">
                    {expanded ? "Hide details ↑" : "View details →"}
                  </button>
                </div>

                {expanded && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Notes</div>
                      <div className="mt-1 text-[11px] font-semibold text-white/85">{a.notes || "—"}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => acknowledge(a.id)}
                        className={[
                          "flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2",
                          "text-[11px] font-extrabold text-white/90 hover:bg-white/10 transition",
                        ].join(" ")}
                      >
                        {a.acknowledged ? "Acknowledged ✓" : "Acknowledge"}
                      </button>

                      <button
                        type="button"
                        onClick={() => resolve(a.id)}
                        className="flex-1 rounded-xl bg-emerald-500/15 px-3 py-2 text-[11px] font-extrabold text-emerald-200 border border-emerald-400/20 hover:bg-emerald-500/20 transition"
                      >
                        Resolve
                      </button>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Assign</div>
                          <div className="mt-1 text-[11px] font-semibold text-white/85">Assign this alert to an operator</div>
                        </div>

                        <select
                          value={a.assignedTo}
                          onChange={(e) => assignTo(a.id, e.target.value)}
                          className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-[11px] font-extrabold text-white/90 outline-none"
                        >
                          <option value="—">Unassigned</option>
                          <option value="Operator 1">Operator 1</option>
                          <option value="Operator 2">Operator 2</option>
                          <option value="Operator 3">Operator 3</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-sm font-extrabold text-white">No alerts found</div>
              <div className="mt-1 text-xs text-text-muted">Try another filter or search term.</div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold text-text-muted">
        Tip: Click an alert to focus the map. Use “Resolve” once handled.
        {enableSimulation && <span className="ml-2 text-white/80">(Simulation enabled)</span>}
      </div>
    </aside>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-lg px-2 py-2 text-[11px] font-extrabold transition",
        active
          ? "bg-accent-orange/15 text-[#ffd7a8] shadow-[0_0_18px_rgba(242,140,27,0.25)]"
          : "text-text-muted hover:text-white hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
