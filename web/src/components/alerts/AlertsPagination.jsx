import React from 'react';

export default function AlertsPagination({
  currentPage = 1,
  totalPages = 8,
  rowsPerPage = 10,
  onRowsPerPageChange,
  onPageChange,
  totalRecords = 72,
}) {
  return (
    <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-3 text-xs select-none font-sans">
      {/* Records Summary */}
      <div className="font-mono text-outline">
        Showing <span className="text-on-surface font-semibold">1–{rowsPerPage}</span> of{' '}
        <span className="text-on-surface font-semibold">{totalRecords}</span> alerts across all sectors
      </div>

      {/* Rows Per Page */}
      <div className="flex items-center gap-2 text-outline">
        <span>Rows per sector view:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange && onRowsPerPageChange(Number(e.target.value))}
          className="bg-surface-container-lowest border border-outline-variant/40 rounded px-2 py-1 text-on-surface font-mono text-xs focus:outline-none focus:border-cyan-400"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center gap-1 font-mono text-xs">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 text-outline hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {[1, 2, 3].map((page) => (
          <button
            key={page}
            onClick={() => onPageChange && onPageChange(page)}
            className={`px-2.5 py-1 rounded transition-colors ${
              currentPage === page
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                : 'bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/40 text-on-surface'
            }`}
          >
            {page}
          </button>
        ))}

        <span className="px-1 text-outline">...</span>

        <button
          onClick={() => onPageChange && onPageChange(totalPages)}
          className={`px-2.5 py-1 rounded transition-colors ${
            currentPage === totalPages
              ? 'bg-cyan-400 text-slate-950 font-bold'
              : 'bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/40 text-on-surface'
          }`}
        >
          {totalPages}
        </button>

        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1 rounded bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/40 text-on-surface hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
