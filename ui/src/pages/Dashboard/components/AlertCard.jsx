import { SEVERITY_STYLES } from "./alertConstants.js";

export function AlertCard({ alert }) {
  // Get severity styling, fallback to Low if not found
  const severityStyle = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low;
  const SeverityIcon = severityStyle.icon;

  return (
    <div className="rounded-sm border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Severity indicator dot */}
          <div className={`mt-1 h-2.5 w-2.5 rounded-full ${severityStyle.dot}`} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white">{alert.title}</h3>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${severityStyle.pill}`}>
                {alert.severity}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#c9d3ee]">{alert.vessel}</p>
            <p className="mt-1 text-[11px] text-[#7f8db3]">{alert.meta}</p>
          </div>
        </div>

        <button 
          type="button"
          className="h-fit rounded-sm bg-[#f28c1b] px-2  py-1 text-[11px] font-bold text-white hover:bg-[#d97706] transition-colors"
        >
          {alert.action}
        </button>
      </div>

      {/* Footer with suggested action */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#9aa8c7]">
        <span className="flex items-center gap-2">
          <SeverityIcon size={14} className="opacity-80" />
          Suggested: {alert.action}
        </span>
        <button 
          type="button"
          className="font-semibold text-[#c9d3ee] hover:text-white transition-colors"
        >
          View details →
        </button>
      </div>
    </div>
  );
}
