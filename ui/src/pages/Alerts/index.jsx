import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertDetailModal } from "./components/AlertDetailModal.jsx";
import { useAlerts } from "./hooks/useAlerts.js";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { SEVERITY, STATUS } from "./constants.js";
import { usePermission } from "../../auth/usePermission.js";

export default function AlertsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { alerts, normalize } = useAlerts(true);
  const { can } = usePermission();

  const filtered = useMemo(() => {
    const q = normalize(query);
    return alerts.filter((a) => {
      const sevOk = severityFilter === "all" ? true : a.level === severityFilter;
      const statusOk = statusFilter === "All" ? true : a.status === statusFilter;
      const hay = normalize(
        `${a.title} ${a.vessel} ${a.mmsi} ${a.description} ${a.status} ${a.level}`
      );
      return (sevOk && statusOk && (q.length === 0 ? true : hay.includes(q)));
    });
  }, [alerts, severityFilter, statusFilter, query, normalize]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
        
        {/* Header / Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
          <div className="flex items-center w-full sm:w-80 border border-gray-200 rounded-md px-3 py-1.5 bg-white focus-within:ring-1 focus-within:ring-[#1b397e] focus-within:border-[#1b397e] transition-colors">
             <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Alerts"
                className="w-full bg-transparent text-sm text-gray-700 font-semibold placeholder-gray-400 outline-none"
             />
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center border border-gray-200 rounded text-sm font-semibold text-gray-700 px-3 py-1.5 bg-white">
                <Filter size={14} className="mr-2 text-gray-400" />
                <select 
                  value={severityFilter} 
                  onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent outline-none cursor-pointer"
                >
                   <option value="all">Filter by All</option>
                   <option value="critical">Filter by Critical</option>
                   <option value="warning">Filter by Warning</option>
                   <option value="info">Filter by Info</option>
                </select>
             </div>
             
             <div className="flex items-center border border-gray-200 rounded text-sm font-semibold text-gray-700 px-3 py-1.5 bg-white">
                <Filter size={14} className="mr-2 text-gray-400" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent outline-none cursor-pointer"
                >
                   <option value="All">All Status</option>
                   <option value="Active">Active</option>
                   <option value="Investigating">Investigating</option>
                   <option value="Resolved">Resolved</option>
                </select>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">MMSI</th>
                <th className="px-6 py-4">VESSEL NAME</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">SEVERITY</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length > 0 ? (
                paginated.map((alert) => {
                  const s = SEVERITY[alert.level] || SEVERITY.info;
                  const st = STATUS[alert.status] || STATUS.Active;
                  
                  return (
                    <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-[#1b397e] font-bold">
                        {alert.mmsi}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1b397e]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                          {alert.vessel}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {alert.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${s.badge}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                        {alert.when}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${st.badge}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/alerts/${alert.id}`)}
                          className="text-[#F28C1B] hover:text-[#d97c18] font-bold text-xs uppercase tracking-wider"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-semibold">
                    No alerts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500">
            Showing {totalItems > 0 ? startIdx : 0} to {endIdx} of {totalItems} alerts
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

      {id && (
        <AlertDetailModal
          alert={alerts.find((a) => String(a.id) === String(id))}
        />
      )}
    </div>
  );
}
