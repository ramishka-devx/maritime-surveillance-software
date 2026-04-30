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
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-[#0b74c9] focus-within:bg-white">
          <Search className="text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search alerts, vessel, MMSI..."
            className="w-full md:w-[340px] bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="rounded flex items-center justify-center bg-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-600 hover:bg-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 rounded-xl border border-gray-200 bg-slate-50 p-1">
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
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9]"
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
