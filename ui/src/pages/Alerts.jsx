import React, { useEffect, useMemo, useRef, useState } from "react";

const SEVERITY = {
  critical: {
    label: "Critical",
    dot: "bg-red-400",
    pill: "bg-red-500/15 text-red-200 border-red-400/25",
    icon: "⛔",
  },
  warning: {
    label: "Warning",
    dot: "bg-amber-300",
    pill: "bg-amber-500/15 text-amber-200 border-amber-400/25",
    icon: "⚠️",
  },
  info: {
    label: "Info",
    dot: "bg-sky-300",
    pill: "bg-sky-500/15 text-sky-200 border-sky-400/25",
    icon: "ℹ️",
  },
};

const STATUS = {
  Active: {
    pill: "bg-red-500/10 text-red-200 border-red-400/20",
  },
  Investigating: {
    pill: "bg-amber-500/10 text-amber-200 border-amber-400/20",
  },
  Resolved: {
    pill: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  },
};

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const enableSimulation = true;

  const [alerts, setAlerts] = useState(() => [
    {
      id: "a1",
      title: "AIS Spoofing Detected",
      level: "critical",
      status: "Resolved",
      when: "2024-01-15 14:23:47",
      vessel: "MV OrionSkies",
      mmsi: "563829104",
      description: "Vessel transmitting false position data",
      notes: "Vessel identified and tracked. Local authorities notified.",
      resolvedBy: "Operator 1",
      assignedTo: "Operator 1",
      acknowledged: true,
      unread: false,
    },
    {
      id: "a2",
      title: "Loitering Behavior",
      level: "warning",
      status: "Active",
      when: "2024-01-15 13:45:12",
      vessel: "SS Pacific Dawn",
      mmsi: "441208773",
      description: "Vessel stationary for extended period",
      notes: "Possible rendezvous. Monitoring for route deviation.",
      resolvedBy: "—",
      assignedTo: "—",
      acknowledged: false,
      unread: true,
    },
    {
      id: "a3",
      title: "Restricted Zone Violation",
      level: "critical",
      status: "Investigating",
      when: "2024-01-15 12:10:22",
      vessel: "Unknown Vessel",
      mmsi: "—",
      description: "Unauthorized entry into protected area",
      notes: "Coast guard dispatched to intercept.",
      resolvedBy: "—",
      assignedTo: "Operator 1",
      acknowledged: false,
      unread: true,
    },
    {
      id: "a4",
      title: "Dark Vessel Detected",
      level: "warning",
      status: "Resolved",
      when: "2024-01-15 11:05:33",
      vessel: "N/A",
      mmsi: "—",
      description: "Vessel detected without AIS transmission",
      notes: "Fishing vessel with malfunctioning AIS transponder.",
      resolvedBy: "Operator 2",
      assignedTo: "Operator 2",
      acknowledged: true,
      unread: false,
    },
    {
      id: "a5",
      title: "Speed Anomaly",
      level: "info",
      status: "Resolved",
      when: "2024-01-15 09:48:18",
      vessel: "HMS Guardian",
      mmsi: "271998120",
      description: "Unusual speed pattern detected",
      notes: "Routine patrol operations confirmed.",
      resolvedBy: "Operator 2",
      assignedTo: "Operator 3",
      acknowledged: true,
      unread: false,
    },
  ]);

  const simCounterRef = useRef(100);
  useEffect(() => {
    if (!enableSimulation) return;

    const candidates = [
      {
        title: "AIS Dropout",
        level: "warning",
        status: "Active",
        vessel: "TS Meridian",
        mmsi: "566210772",
        description: "AIS signal lost for 6 minutes",
        notes: "Attempt radar correlation and identify track.",
      },
      {
        title: "Geofence Proximity",
        level: "info",
        status: "Active",
        vessel: "MV Seabird",
        mmsi: "412009331",
        description: "Approaching Zone A-2 boundary",
        notes: "Monitor for entry; notify if crossing threshold.",
      },
      {
        title: "Restricted Zone Entry",
        level: "critical",
        status: "Active",
        vessel: "Unknown Vessel",
        mmsi: "—",
        description: "Entered Zone C-1",
        notes: "Immediate response recommended. Verify via sensors.",
      },
    ];

    const t = setInterval(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      simCounterRef.current += 1;

      const newAlert = {
        id: `a${simCounterRef.current}`,
        ...pick,
        when: "Just now",
        resolvedBy: "—",
        assignedTo: "—",
        acknowledged: false,
        unread: true,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
    }, 12000);

    return () => clearInterval(t);
  }, [enableSimulation]);

  const unreadCount = useMemo(
    () => alerts.reduce((acc, a) => acc + (a.unread ? 1 : 0), 0),
    [alerts]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);

    return alerts.filter((a) => {
      const sevOk = severityFilter === "all" ? true : a.level === severityFilter;
      const statusOk = statusFilter === "All" ? true : a.status === statusFilter;

      const hay = normalize(
        `${a.title} ${a.vessel} ${a.mmsi} ${a.description} ${a.status} ${a.level} ${a.assignedTo} ${a.resolvedBy}`
      );

      const qOk = q.length === 0 ? true : hay.includes(q);

      return sevOk && statusOk && qOk;
    });
  }, [alerts, severityFilter, statusFilter, query]);

  const markRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unread: false } : a))
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
    markRead(id);
  };

  const acknowledge = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged: true, unread: false } : a
      )
    );
  };

  const resolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Resolved",
              acknowledged: true,
              unread: false,
              resolvedBy: a.resolvedBy === "—" ? "Operator 1" : a.resolvedBy,
            }
          : a
      )
    );
  };

  const assignTo = (id, name) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignedTo: name, unread: false } : a))
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Alerts</h1>
          <p className="text-xs font-semibold text-text-muted">
            Complete log of all surveillance alerts
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-accent-orange px-2 py-0.5 text-[10px] font-extrabold text-white">
                {unreadCount} new
              </span>
            )}
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white/80">🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search alerts, vessel, MMSI..."
                className="w-full md:w-[340px] bg-transparent text-xs font-semibold text-white placeholder:text-text-muted outline-none"
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

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                <Tab label="All" active={severityFilter === "all"} onClick={() => setSeverityFilter("all")} />
                <Tab label="Critical" active={severityFilter === "critical"} onClick={() => setSeverityFilter("critical")} />
                <Tab label="Warning" active={severityFilter === "warning"} onClick={() => setSeverityFilter("warning")} />
                <Tab label="Info" active={severityFilter === "info"} onClick={() => setSeverityFilter("info")} />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-[11px] font-extrabold text-white/90 outline-none"
              >
                <option value="All" className="bg-[#0b1220] text-white">All Status</option>
                <option value="Active" className="bg-[#0b1220] text-white">Active</option>
                <option value="Investigating" className="bg-[#0b1220] text-white">Investigating</option>
                <option value="Resolved" className="bg-[#0b1220] text-white">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pb-10">
          {filtered.map((a) => {
            const s = SEVERITY[a.level] || SEVERITY.info;
            const st = STATUS[a.status] || STATUS.Active;
            const expanded = expandedId === a.id;

            return (
              <div
                key={a.id}
                className={[
                  "rounded-2xl border border-white/10 bg-white/5 p-4",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
                  a.unread ? "ring-1 ring-accent-orange/25" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(a.id)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border ${s.pill}`}>
                      <span className="text-sm">{s.icon}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.unread && <span className="h-2 w-2 rounded-full bg-accent-orange" />}

                        <span className="text-sm font-extrabold text-white">{a.title}</span>

                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${s.pill}`}>
                          {s.label}
                        </span>

                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${st.pill}`}>
                          {a.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/80">
                        <span>🗓 {a.when}</span>
                        <span>•</span>
                        <span>🚢 {a.vessel}</span>
                        {a.mmsi !== "—" && (
                          <>
                            <span>•</span>
                            <span>MMSI {a.mmsi}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 text-[12px] font-semibold text-text-muted">
                        {a.description}
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-extrabold ${st.pill}`}>
                      {a.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => resolve(a.id)}
                      className="rounded-lg bg-accent-orange px-3 py-2 text-[11px] font-extrabold text-white hover:bg-[#d97706] transition"
                    >
                      {a.status === "Resolved" ? "Resolved" : "Resolve"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Notes</div>
                      <div className="mt-1 text-[11px] font-semibold text-white/85">{a.notes || "—"}</div>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="text-[11px] font-semibold text-text-muted">
                        Resolved by <span className="text-white/80 font-extrabold">{a.resolvedBy}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => acknowledge(a.id)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-extrabold text-white/90 hover:bg-white/10 transition"
                        >
                          {a.acknowledged ? "Acknowledged ✓" : "Acknowledge"}
                        </button>

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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <div className="text-base font-extrabold text-white">No alerts found</div>
              <div className="mt-2 text-xs font-semibold text-text-muted">Try another filter or search term.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-3 py-2 text-[15px] font-extrabold transition",
        active
          ? "bg-accent-orange/15 text-[#ffd7a8] shadow-[0_0_18px_rgba(242,140,27,0.25)]"
          : "text-text-muted hover:text-white hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
