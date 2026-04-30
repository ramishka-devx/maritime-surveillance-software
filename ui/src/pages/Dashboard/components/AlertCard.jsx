import { SEVERITY_STYLES } from "./alertConstants.js";

export function AlertCard({ alert, onAlertClick }) {
  // Get severity styling, fallback to Low if not found
  const severityStyle = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low;
  const SeverityIcon = severityStyle.icon;

  return (
    <div 
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#0b74c9]/30 hover:bg-[#f9fbfd] transition-all group"
      onClick={() => onAlertClick?.(alert.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Severity indicator dot */}
          <div className={`mt-1.5 h-2 w-2 rounded-full ring-4 ring-opacity-20 ${severityStyle.dot.replace('bg-', 'bg-').replace('shadow-', 'ring-')}`} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#0b74c9] transition-colors">{alert.title}</h3>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${severityStyle.pill.replace('text-white', 'text-slate-700 bg-opacity-20')}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600">{alert.vessel}</p>
            <p className="mt-0.5 text-xs text-slate-500">{alert.meta}</p>
          </div>
        </div>

        <button 
          type="button"
          className="h-fit rounded-lg bg-[#08244a] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0b74c9] transition-colors shadow-sm"
        >
          {alert.action}
        </button>
      </div>

      {/* Footer with suggested action */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-2 text-slate-600">
          <SeverityIcon size={14} className="opacity-70 text-slate-400" />
          Suggested: <span className="text-slate-800 font-semibold">{alert.action}</span>
        </span>
        <button 
          type="button"
          className="font-bold text-[#0b74c9] hover:text-[#08244a] transition-colors flex items-center gap-1"
        >
          View details <span className="text-[10px]">→</span>
        </button>
      </div>
    </div>
  );
}
