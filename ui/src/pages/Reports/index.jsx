import React, { useMemo, useState } from "react";
import { useReports } from "./hooks/useReports.js";
import { ReportFilters } from "./components/ReportFilters.jsx";
import { ReportItem } from "./components/ReportItem.jsx";

export default function Reports() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const { recentReports, getFilteredReports } = useReports();

  const filtered = useMemo(() => {
    return getFilteredReports(recentReports, query, typeFilter, sortBy);
  }, [recentReports, query, typeFilter, sortBy, getFilteredReports]);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(recentReports.map((r) => r.type)))],
    [recentReports]
  );

  const handleDownload = (report) => {
    alert(`Downloading: ${report.title}`);
  };

  const handleGenerate = () => {
    alert("Open report generator modal (TODO)");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Reports</h1>
          <p className="text-xs font-semibold text-text-muted">Generate and download surveillance reports</p>
        </div>

        <ReportFilters
          query={query}
          onQueryChange={setQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          types={types}
          onGenerate={handleGenerate}
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="mb-3">
            <div className="text-base font-extrabold text-white">Recent Reports</div>
            <div className="text-xs font-semibold text-text-muted">
              {filtered.length} report{filtered.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((r) => (
              <ReportItem
                key={r.id}
                report={r}
                onDownload={handleDownload}
              />
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
