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
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={18} className="text-white/70" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search reports..."
            className="w-full md:w-[320px] bg-transparent text-xs font-semibold text-white placeholder:text-text-muted outline-none"
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
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/90 outline-none"
          >
            {types.map((t) => (
              <option key={t} value={t} className="bg-[#0b1220] text-white">
                {t === "All" ? "All Types" : t}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/90 outline-none"
          >
            <option value="Newest" className="bg-[#0b1220] text-white">Newest</option>
            <option value="Oldest" className="bg-[#0b1220] text-white">Oldest</option>
            <option value="Title A-Z" className="bg-[#0b1220] text-white">Title A-Z</option>
            <option value="Title Z-A" className="bg-[#0b1220] text-white">Title Z-A</option>
          </select>

          <button
            type="button"
            onClick={onGenerate}
            className="rounded-xl bg-primary-blue px-3 py-2 text-[11px] font-bold text-white hover:bg-[#1f3570] transition"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
