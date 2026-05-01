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
    <div className="min-h-[calc(100vh-64px)] bg-[#f9fbfd] px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-xl font-extrabold text-[#08244a]">Reports</h1>
          <p className="text-sm font-medium text-slate-500">Generate and download surveillance reports</p>
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

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <div className="text-base font-extrabold text-[#08244a]">Recent Reports</div>
            <div className="text-xs font-medium text-slate-500">
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
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-8 text-center">
                <div className="text-sm font-extrabold text-slate-800">No reports found</div>
                <div className="mt-1 text-sm font-medium text-slate-500">Try a different search or filter.</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-[15px] font-semibold text-slate-500">
          Tip: Use <span className="text-[#08244a] font-bold">Generate</span> to create a new report template, then download it here.
        </div>
      </div>
    </div>
  );
}
