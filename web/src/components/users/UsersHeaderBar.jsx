import React from 'react';

export default function UsersHeaderBar({ totalUsers, activeUsers, onExport, onOpenCreateDrawer }) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border-b border-slate-200 select-none font-sans shadow-xs">
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 m-0">
              Users
            </h1>
            
          </div>
        </div>
        
      </div>

      {/* Global Roster Actions */}
      <div className="flex items-center gap-2.5 self-start lg:self-auto font-mono text-xs">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors uppercase tracking-wider cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px] text-[#0891b2]">download</span>
          <span>Export</span>
        </button>
        <button
          onClick={onOpenCreateDrawer}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#0891b2] text-white hover:bg-[#0e7490] font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Invite User</span>
        </button>
      </div>
    </div>
  );
}
