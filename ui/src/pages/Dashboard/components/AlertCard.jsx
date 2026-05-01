import { SEVERITY_STYLES } from "./alertConstants.js";

export function AlertCard({ alert, onAlertClick }) {
  return (
    <div
      onClick={() => onAlertClick?.(alert.id)}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
    >
      {/* TOP SECTION */}
      <div className="flex items-start justify-between gap-3">
        
        {/* LEFT */}
        <div className="flex flex-1 items-start gap-3">
          
          {/* Subtle neutral indicator */}
          <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 opacity-70" />

          <div className="flex-1">
            
            {/* TITLE */}
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-[#0b74c9] transition-colors">
                {alert.title}
              </h3>

              {/* Calm badge (no bright colors) */}
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {alert.severity}
              </span>
            </div>

            {/* META */}
            <p className="mt-1 text-xs font-medium text-slate-600">
              {alert.vessel}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {alert.meta}
            </p>
          </div>
        </div>

        {/* ACTION BUTTON */}
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