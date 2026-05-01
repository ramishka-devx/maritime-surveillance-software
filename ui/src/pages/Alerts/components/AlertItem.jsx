import { useNavigate } from "react-router-dom";
import { Calendar, Ship } from "lucide-react";
import { SEVERITY, STATUS } from "../constants.js";
import { usePermission } from "../../../auth/usePermission.js";

export function AlertItem({
  alert,
  expanded,
  onToggleExpand,
  onAcknowledge,
  onResolve,
  onAssignTo,
}) {
  const navigate = useNavigate();
  const s = SEVERITY[alert.level] || SEVERITY.info;
  const st = STATUS[alert.status] || STATUS.Active;
  const { can } = usePermission();
  const canManageStatus = can('alert.status.view');

  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md",
        "shadow-sm",
        alert.unread ? "ring-2 ring-[#0b74c9]/20" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`/alerts/${alert.id}`)}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border ${s.pill}`}>
            <s.icon size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {alert.unread && <span className="h-2 w-2 rounded-full bg-[#0b74c9]" />}

              <span className="text-sm font-extrabold text-[#08244a]">{alert.title}</span>

              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${s.pill}`}>
                {s.label}
              </span>

              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${st.pill}`}>
                {alert.status}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{alert.when}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Ship size={14} />
                <span>{alert.vessel}</span>
              </div>
              {alert.mmsi !== "—" && (
                <>
                  <span>•</span>
                  <span>MMSI {alert.mmsi}</span>
                </>
              )}
            </div>

            <div className="mt-2 text-[12px] font-medium text-slate-600">
              {alert.description}
            </div>
          </div>
        </button>

        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-md border px-2 py-1 text-[10px] font-extrabold ${st.pill}`}>
            {alert.status}
          </span>

          <button
            type="button"
            onClick={() => onResolve(alert.id)}
            disabled={!canManageStatus}
            className={[
              "rounded-lg px-3 py-2 text-[11px] font-extrabold transition",
              canManageStatus
                ? "bg-[#0b74c9] text-white hover:bg-[#095ca5] active:bg-[#074782]"
                : "cursor-not-allowed border border-gray-200 bg-slate-50 text-slate-400",
            ].join(" ")}
            title={canManageStatus ? "Resolve alert" : "Requires permission: alert.status.view"}
          >
            {alert.status === "Resolved" ? "Resolved" : "Resolve"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#08244a]">
              Notes
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-600">{alert.notes || "—"}</div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-[11px] font-semibold text-slate-500">
              Resolved by <span className="font-extrabold text-[#08244a]">{alert.resolvedBy}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAcknowledge(alert.id)}
                disabled={!canManageStatus}
                className={[
                  "rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-extrabold transition",
                  canManageStatus
                    ? "bg-white text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed bg-slate-50 text-slate-400",
                ].join(" ")}
                title={canManageStatus ? "Acknowledge alert" : "Requires permission: alert.status.view"}
              >
                {alert.acknowledged ? "Acknowledged ✓" : "Acknowledge"}
              </button>

              <select
                value={alert.assignedTo}
                onChange={(e) => onAssignTo(alert.id, e.target.value)}
                disabled={!canManageStatus}
                className={[
                  "rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-extrabold outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9]",
                  canManageStatus
                    ? "bg-white text-slate-700"
                    : "cursor-not-allowed bg-slate-50 text-slate-400",
                ].join(" ")}
                title={canManageStatus ? "Assign alert" : "Requires permission: alert.status.view"}
              >
                <option value="—">Unassigned</option>
                <option value="Operator 1">Operator 1</option>
                <option value="Operator 2">Operator 2</option>
                <option value="Operator 3">Operator 3</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
