import React from 'react';

export default function DetectionModulesNav({
  models,
  selectedModelId,
  onSelectModel,
  searchFilter,
  onSearchFilterChange,
}) {
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <aside className="flex flex-col gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 shadow-sm font-sans select-none">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
          <span className="font-mono text-xs text-outline uppercase tracking-wider font-semibold">
            Detection Modules
          </span>
          <span className="font-mono text-xs text-cyan-400 font-bold">
            {models.length} LOADED
          </span>
        </div>

        {/* Filter Input */}
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px]">filter_list</span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => onSearchFilterChange(e.target.value)}
            placeholder="Filter models..."
            className="w-full bg-surface-container-lowest rounded pl-8 pr-3 py-1.5 text-on-surface font-mono text-xs placeholder:text-outline border border-outline-variant/40 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Navigation Model Stack */}
      <nav className="flex flex-col gap-1.5">
        {filteredModels.map((m) => {
          const isSelected = m.id === selectedModelId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectModel(m.id)}
              className={`w-full text-left p-3 rounded flex items-start gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface-container-high border-2 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.2)] text-cyan-400'
                  : 'bg-surface-container/60 border border-outline-variant/30 hover:border-outline text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <div
                className={`mt-0.5 p-1 rounded shrink-0 ${
                  isSelected
                    ? 'bg-surface-container-lowest text-cyan-400'
                    : 'bg-surface-container text-outline'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold tracking-tight truncate ${
                      isSelected ? 'text-cyan-400' : 'text-on-surface'
                    }`}
                  >
                    {m.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono text-[10px] uppercase font-bold shrink-0 ml-1 ${
                      m.badgeColor || (isSelected ? 'bg-surface-container-lowest text-cyan-400' : 'bg-surface-container-highest text-outline')
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-on-surface-variant truncate mt-0.5 m-0 leading-tight">
                  {m.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Telemetry Diagnostic Card */}
      <div className="mt-2 p-3 rounded bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-outline uppercase font-semibold">Pipeline Cycle</span>
          <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            30s INTERVAL
          </span>
        </div>

        <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
          <div className="bg-cyan-400 h-full w-2/3" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
          <span>RAM: <strong className="text-on-surface">3.42 GB</strong></span>
          <span>GPU: <strong className="text-cyan-400">41%</strong></span>
          <span>Q-DEPTH: <strong className="text-emerald-400">0</strong></span>
        </div>
      </div>
    </aside>
  );
}
