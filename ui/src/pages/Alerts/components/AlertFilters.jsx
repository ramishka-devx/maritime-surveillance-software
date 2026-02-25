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
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <Search className="text-white/80" size={18} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search alerts, vessel, MMSI..."
            className="w-full md:w-[340px] bg-transparent text-xs font-semibold text-white placeholder:text-text-muted outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-extrabold text-white/80 hover:bg-white/10"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
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
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-[11px] font-extrabold text-white/90 outline-none"
          >
            <option value="All" className="bg-[#0b1220] text-white">
              All Status
            </option>
            <option value="Active" className="bg-[#0b1220] text-white">
              Active
            </option>
            <option value="Investigating" className="bg-[#0b1220] text-white">
              Investigating
            </option>
            <option value="Resolved" className="bg-[#0b1220] text-white">
              Resolved
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
