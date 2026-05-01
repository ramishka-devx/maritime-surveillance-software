import { SEVERITY_STYLES } from "./alertConstants.js";

const SEVERITY_BORDER = {
  Critical: "border-l-red-500",
  High: "border-l-orange-500",
  Medium: "border-l-amber-500",
  Low: "border-l-emerald-500",
};

export function AlertCard({ alert, onAlertClick }) {
  const severityStyle = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low;
  const severityBorder = SEVERITY_BORDER[alert.severity] || SEVERITY_BORDER.Low;

  return (
    <div
      className={`group cursor-pointer rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)] ${severityBorder}`}
      onClick={() => onAlertClick?.(alert.id)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-100 ${severityStyle.dot}`} />

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-[#0b74c9]">{alert.title}</h3>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${severityStyle.pill}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600">{alert.vessel}</p>
            <p className="mt-0.5 text-xs text-slate-500">{alert.meta}</p>
          </div>
        </div>

        <button
          type="button"
          className="h-fit rounded-lg bg-gradient-to-r from-[#0b74c9] to-[#4a9adf] px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(11,116,201,0.20)] transition-all hover:from-[#0967b3] hover:to-[#3f89c6]"
        >
          {alert.action}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        <span>
          Suggested: <span className="font-semibold text-slate-700">{alert.action}</span>
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
