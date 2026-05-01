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
    const encoder = new TextEncoder();

    const escapePdfString = (value) =>
      String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

    const makeFileName = (value) => {
      const base = String(value || "report").trim() || "report";
      return base.replace(/[\\/:*?\"<>|]+/g, "-");
    };

    const makeSimplePdfBytes = (text) => {
      const safeText = escapePdfString(text);
      const content = `BT\n/F1 24 Tf\n72 720 Td\n(${safeText}) Tj\nET\n`;
      const contentLength = encoder.encode(content).length;

      const header = "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n";
      const objects = [
        null,
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}endstream\nendobj\n`,
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      ];

      const parts = [header];
      const offsets = new Array(6).fill(0);

      let offset = encoder.encode(header).length;
      for (let i = 1; i <= 5; i += 1) {
        offsets[i] = offset;
        parts.push(objects[i]);
        offset += encoder.encode(objects[i]).length;
      }

      const xrefStart = offset;
      const pad10 = (n) => String(n).padStart(10, "0");
      let xref = "xref\n0 6\n0000000000 65535 f \n";
      for (let i = 1; i <= 5; i += 1) {
        xref += `${pad10(offsets[i])} 00000 n \n`;
      }

      xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
      parts.push(xref);

      return encoder.encode(parts.join(""));
    };

    const bytes = makeSimplePdfBytes("trst dummy");
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${makeFileName(report?.title)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
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
