import React, { useMemo, useState } from "react";
import { FileText, Download, Search, Calendar } from "lucide-react";

const TYPE_STYLES = {
  Summary: "bg-white/5 text-white/80 border-white/10",
  Anomaly: "bg-amber-500/10 text-amber-200 border-amber-400/20",
  Security: "bg-red-500/10 text-red-200 border-red-400/20",
  Violation: "bg-purple-500/10 text-purple-200 border-purple-400/20",
  Analysis: "bg-sky-500/10 text-sky-200 border-sky-400/20",
};



export default function Reports() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const recentReports = useMemo(
    () => [
      { id: 1, title: "Daily Surveillance Summary", date: "2024-01-15", type: "Summary", stats: "12 alerts • 156 vessels" },
      { id: 2, title: "Anomaly Detection Report", date: "2024-01-15", type: "Anomaly", stats: "8 alerts • 9 vessels" },
      { id: 3, title: "AIS Spoofing Incidents", date: "2024-01-14", type: "Security", stats: "3 alerts • 3 vessels" },
      { id: 4, title: "Restricted Zone Violations", date: "2024-01-14", type: "Violation", stats: "5 alerts • 5 vessels" },
      { id: 5, title: "Weekly Activity Analysis", date: "2024-01-12", type: "Analysis", stats: "45 alerts • 892 vessels" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let arr = recentReports.filter((r) => {
      const qOk = q.length === 0 ? true : `${r.title} ${r.type}`.toLowerCase().includes(q);
      const tOk = typeFilter === "All" ? true : r.type === typeFilter;
      return qOk && tOk;
    });

    arr.sort((a, b) => {
      if (sortBy === "Newest") return b.date.localeCompare(a.date);
      if (sortBy === "Oldest") return a.date.localeCompare(b.date);
      if (sortBy === "Title A-Z") return a.title.localeCompare(b.title);
      if (sortBy === "Title Z-A") return b.title.localeCompare(a.title);
      return 0;
    });

    return arr;
  }, [recentReports, query, typeFilter, sortBy]);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(recentReports.map((r) => r.type)))],
    [recentReports]
  );

  const handleDownload = (report) => {
    alert(`Downloading: ${report.title}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Reports</h1>
          <p className="text-xs font-semibold text-text-muted">Generate and download surveillance reports</p>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Search size={18} className="text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reports..."
                className="w-full md:w-[320px] bg-transparent text-xs font-semibold text-white placeholder:text-text-muted outline-none"
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
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
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
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/90 outline-none"
              >
                <option value="Newest" className="bg-[#0b1220] text-white">Newest</option>
                <option value="Oldest" className="bg-[#0b1220] text-white">Oldest</option>
                <option value="Title A-Z" className="bg-[#0b1220] text-white">Title A-Z</option>
                <option value="Title Z-A" className="bg-[#0b1220] text-white">Title Z-A</option>
              </select>

              <button
                type="button"
                onClick={() => alert("Open report generator modal (TODO)")}
                className="rounded-xl bg-primary-blue px-3 py-2 text-[11px] font-bold text-white hover:bg-[#1f3570] transition"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="mb-3">
            <div className="text-sm font-extrabold text-white">Recent Reports</div>
            <div className="text-[11px] font-semibold text-text-muted">
              {filtered.length} report{filtered.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80">
                    <FileText size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-extrabold text-white">{r.title}</div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} />
                        {r.date}
                      </span>

                      <span
                        className={[
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold",
                          TYPE_STYLES[r.type] || TYPE_STYLES.Summary,
                        ].join(" ")}
                      >
                        {r.type}
                      </span>

                      <span className="text-white/70">• {r.stats}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(r)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-orange px-4 py-2 text-[11px] font-extrabold text-white hover:bg-[#d97706] transition shadow-[0_8px_18px_rgba(242,140,27,0.20)]"
                  title="Download report"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-sm font-extrabold text-white">No reports found</div>
                <div className="mt-1 text-sm font-semibold text-text-muted">Try a different search or filter.</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-[15px] font-semibold text-text-muted">
          Tip: Use <span className="text-white/80">Generate</span> to create a new report template, then download it here.
        </div>
      </div>
    </div>
  );
}
