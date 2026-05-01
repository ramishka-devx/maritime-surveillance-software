import { Search } from "lucide-react";
import { Tab } from "./Tab.jsx";

export function AlertFilters({
  query,
  onQueryChange,
  severityFilter,
  onSeverityChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="text-text-muted" size={18} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search alerts, vessel, MMSI..."
            className="w-full md:w-[340px] bg-transparent text-xs font-semibold text-text-primary placeholder:text-text-light outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-extrabold text-text-muted hover:bg-slate-50 hover:text-[#0b74c9] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Tab
              label="All"
              active={severityFilter === "all"}
              onClick={() => onSeverityChange("all")}
            />
            <Tab
              label="Critical"
              active={severityFilter === "critical"}
              onClick={() => onSeverityChange("critical")}
            />
            <Tab
              label="Warning"
              active={severityFilter === "warning"}
              onClick={() => onSeverityChange("warning")}
            />
            <Tab
              label="Info"
              active={severityFilter === "info"}
              onClick={() => onSeverityChange("info")}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-text-secondary outline-none focus:border-[#0b74c9] focus:ring-2 focus:ring-[#0b74c9]/15 transition-colors"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>
    </div>
  );
}
