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
  const s = SEVERITY[alert.level] || SEVERITY.info;
  const st = STATUS[alert.status] || STATUS.Active;
  const { can } = usePermission();
  const canManageStatus = can('alert.status.view');

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/5 p-4",
        "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        alert.unread ? "ring-1 ring-accent-orange/25" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onToggleExpand(alert.id)}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border ${s.pill}`}>
            <s.icon size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {alert.unread && <span className="h-2 w-2 rounded-full bg-accent-orange" />}

              <span className="text-sm font-extrabold text-white">{alert.title}</span>

              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${s.pill}`}>
                {s.label}
              </span>

              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${st.pill}`}>
                {alert.status}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/80">
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

            <div className="mt-2 text-[12px] font-semibold text-text-muted">
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
                ? "bg-accent-orange text-white hover:bg-[#d97706]"
                : "cursor-not-allowed border border-white/10 bg-white/5 text-white/60",
            ].join(" ")}
            title={canManageStatus ? "Resolve alert" : "Requires permission: alert.status.view"}
          >
            {alert.status === "Resolved" ? "Resolved" : "Resolve"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
              Notes
            </div>
            <div className="mt-1 text-[11px] font-semibold text-white/85">{alert.notes || "—"}</div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-[11px] font-semibold text-text-muted">
              Resolved by <span className="text-white/80 font-extrabold">{alert.resolvedBy}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAcknowledge(alert.id)}
                disabled={!canManageStatus}
                className={[
                  "rounded-xl border border-white/10 px-3 py-2 text-[11px] font-extrabold transition",
                  canManageStatus
                    ? "bg-white/5 text-white/90 hover:bg-white/10"
                    : "cursor-not-allowed bg-white/5 text-white/50",
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
                  "rounded-xl border border-white/10 px-3 py-2 text-[11px] font-extrabold outline-none",
                  canManageStatus
                    ? "bg-[#0b1220] text-white/90"
                    : "cursor-not-allowed bg-white/5 text-white/50",
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
