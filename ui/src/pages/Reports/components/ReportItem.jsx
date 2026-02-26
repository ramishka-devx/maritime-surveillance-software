import { FileText, Download, Calendar } from "lucide-react";
import { TYPE_STYLES } from "../constants.js";
import { usePermission } from "../../../auth/usePermission.js";

export function ReportItem({ report, onDownload }) {
  const { can } = usePermission();
  const canDownload = can('report.download');

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80">
          <FileText size={16} />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-white">{report.title}</div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
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

            <span className="text-white/70">• {report.stats}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDownload(report)}
        disabled={!canDownload}
        className={[
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-extrabold transition",
          canDownload
            ? "bg-accent-orange text-white hover:bg-[#d97706] shadow-[0_8px_18px_rgba(242,140,27,0.20)]"
            : "cursor-not-allowed border border-white/10 bg-white/5 text-white/60",
        ].join(" ")}
        title={canDownload ? "Download report" : "Requires permission: report.download"}
      >
        <Download size={16} />
        Download
      </button>
    </div>
  );
}
