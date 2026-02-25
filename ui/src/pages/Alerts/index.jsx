import React, { useMemo, useState } from "react";
import { AlertFilters } from "./components/AlertFilters.jsx";
import { AlertItem } from "./components/AlertItem.jsx";
import { useAlerts } from "./hooks/useAlerts.js";

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const {
    alerts,
    unreadCount,
    markRead,
    acknowledge,
    resolve,
    assignTo,
    normalize,
  } = useAlerts(true);

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
  }, [alerts, severityFilter, statusFilter, query, normalize]);

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
    markRead(id);
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

        <AlertFilters
          query={query}
          onQueryChange={setQuery}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <div className="space-y-4 pb-10">
          {filtered.map((a) => (
            <AlertItem
              key={a.id}
              alert={a}
              expanded={expandedId === a.id}
              onToggleExpand={toggleExpand}
              onAcknowledge={acknowledge}
              onResolve={resolve}
              onAssignTo={assignTo}
            />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <div className="text-base font-extrabold text-white">No alerts found</div>
              <div className="mt-2 text-xs font-semibold text-text-muted">
                Try another filter or search term.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
