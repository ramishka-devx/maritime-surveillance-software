import { Search } from "lucide-react";

export function ReportFilters({
  query,
  onQueryChange,
  typeFilter,
  onTypeChange,
  sortBy,
  onSortChange,
  types,
  onGenerate,
}) {
  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-[#0b74c9] focus-within:bg-white">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search reports..."
            className="w-full md:w-[320px] bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
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
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9]"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All Types" : t}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9]"
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Title A-Z">Title A-Z</option>
            <option value="Title Z-A">Title Z-A</option>
          </select>

          <button
            type="button"
            onClick={onGenerate}
            className="rounded-xl bg-[#08244a] px-3 py-2 text-sm font-bold text-white hover:bg-[#061c39] transition shadow-sm"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
