import React, { useMemo, useState } from "react";
import { useReports } from "./hooks/useReports.js";
import { ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import { TYPE_STYLES } from "./constants.js";
import { usePermission } from "../../auth/usePermission.js";

export default function Reports() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { recentReports, getFilteredReports } = useReports();
  const { can } = usePermission();
  const canDownload = can('report.download');

  const filtered = useMemo(() => {
    return getFilteredReports(recentReports, query, typeFilter, sortBy);
  }, [recentReports, query, typeFilter, sortBy, getFilteredReports]);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(recentReports.map((r) => r.type)))],
    [recentReports]
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

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
    <div className="flex flex-col h-full bg-[#f1f5f9]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
        
        {/* Header / Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
          <div className="flex items-center w-full sm:w-80 border border-gray-200 rounded-md px-3 py-1.5 bg-white focus-within:ring-1 focus-within:ring-[#1b397e] focus-within:border-[#1b397e] transition-colors">
             <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Reports"
                className="w-full bg-transparent text-sm text-gray-700 font-semibold placeholder-gray-400 outline-none"
             />
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center border border-gray-200 rounded text-sm font-semibold text-gray-700 px-3 py-1.5 bg-white">
                <Filter size={14} className="mr-2 text-gray-400" />
                <select 
                  value={typeFilter} 
                  onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent outline-none cursor-pointer"
                >
                   {types.map(t => (
                     <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>
                   ))}
                </select>
             </div>
             
             <div className="flex items-center border border-gray-200 rounded text-sm font-semibold text-gray-700 px-3 py-1.5 bg-white">
                <Filter size={14} className="mr-2 text-gray-400" />
                <select 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent outline-none cursor-pointer"
                >
                   <option value="Newest">Newest First</option>
                   <option value="Oldest">Oldest First</option>
                   <option value="Title A-Z">Title A-Z</option>
                   <option value="Title Z-A">Title Z-A</option>
                </select>
             </div>

             <button
               onClick={handleGenerate}
               className="bg-[#1b397e] text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-[#132c66] transition-colors shadow-sm"
             >
               Generate Report
             </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">REPORT TITLE</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">STATS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length > 0 ? (
                paginated.map((report) => {
                  const style = TYPE_STYLES[report.type] || TYPE_STYLES.Summary;
                  
                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1b397e]">
                        {report.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${style}`}>
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                        {report.date}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                        {report.stats}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDownload(report)}
                          disabled={!canDownload}
                          className="text-[#F28C1B] hover:text-[#d97c18] font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1 mx-auto"
                          title={canDownload ? "Download report" : "Requires permission: report.download"}
                        >
                          <Download size={14} /> Download
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-semibold">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500">
            Showing {totalItems > 0 ? startIdx : 0} to {endIdx} of {totalItems} reports
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-400 hover:text-[#1b397e] disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => (
               <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${
                    currentPage === i + 1 
                      ? 'bg-[#1b397e] text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
               >
                 {i + 1}
               </button>
            ))}
            
            {totalPages > 3 && (
               <span className="text-gray-400 px-1">...</span>
            )}
            
            {totalPages > 3 && (
               <button 
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${
                    currentPage === totalPages 
                      ? 'bg-[#1b397e] text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
               >
                 {totalPages}
               </button>
            )}

            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-400 hover:text-[#1b397e] disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
