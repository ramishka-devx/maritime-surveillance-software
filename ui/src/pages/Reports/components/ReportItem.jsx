import { FileText, Download, Calendar } from "lucide-react";
import { TYPE_STYLES } from "../constants.js";
import { usePermission } from "../../../auth/usePermission.js";

export function ReportItem({ report, onDownload }) {
  const { can } = usePermission();
  const canDownload = can('report.download');

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-3 hover:bg-slate-50 transition shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-slate-100 text-slate-500">
          <FileText size={16} />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-[#08244a]">{report.title}</div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} />
              {report.date}
            </span>

            <span
              className={[
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-extrabold",
                TYPE_STYLES[report.type] || TYPE_STYLES.Summary,
              ].join(" ")}
            >
              {report.type}
            </span>

            <span className="text-slate-400">• {report.stats}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDownload(report)}
        disabled={!canDownload}
        className={[
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition",
          canDownload
            ? "bg-[#0b74c9] text-white hover:bg-[#095ca5] shadow-sm"
            : "cursor-not-allowed border border-gray-200 bg-slate-50 text-slate-400",
        ].join(" ")}
        title={canDownload ? "Download report" : "Requires permission: report.download"}
      >
        <Download size={16} />
        Download
      </button>
    </div>
  );
}
