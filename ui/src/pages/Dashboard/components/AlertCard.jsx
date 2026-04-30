import { SEVERITY_STYLES } from "./alertConstants.js";

export function AlertCard({ alert, onAlertClick }) {
  // Get severity styling, fallback to Low if not found
  const severityStyle = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low;

  return (
    <div
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all group hover:border-[#0b74c9]/30 hover:bg-[#f9fbfd] hover:shadow-md"
      onClick={() => onAlertClick?.(alert.id)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <div className={`mt-1.5 h-2 w-2 rounded-full ring-4 ring-opacity-20 ${severityStyle.dot.replace('bg-', 'bg-').replace('shadow-', 'ring-')}`} />

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-[#0b74c9]">{alert.title}</h3>
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
          className="h-fit rounded-lg bg-[#08244a] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#0b74c9]"
        >
          {alert.action}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-slate-500">
        <span className="text-slate-600">
          Suggested: <span className="font-semibold text-slate-800">{alert.action}</span>
        </span>
        <button
          type="button"
          className="font-bold text-[#0b74c9] transition-colors hover:text-[#08244a]"
        >
          View details
        </button>
      </div>
    </div>
  );
}
