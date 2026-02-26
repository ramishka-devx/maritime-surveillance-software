import { useNavigate } from "react-router-dom";
import {
  X,
  Clock,
  Ship,
  Hash,
  FileText,
  User,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { SEVERITY, STATUS } from "../constants.js";

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <Icon size={13} className="text-[#9aa8c7]" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7f8db3]">
          {label}
        </p>
        <p className={`mt-0.5 text-xs text-[#c9d3ee] ${valueClass}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

export function AlertDetailModal({ alert, onClose }) {
  const navigate = useNavigate();

  if (!alert) return null;

  const s = SEVERITY[alert.level] || SEVERITY.info;
  const st = STATUS[alert.status] || STATUS.Active;
  const SeverityIcon = s.icon;

  const handleClose = onClose ?? (() => navigate("/alerts", { replace: true }));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Modal panel */}
      <div
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${s.pill}`}
            >
              <SeverityIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-snug">
                {alert.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#9aa8c7]">
                {alert.vessel} {alert.mmsi !== "—" ? `• MMSI ${alert.mmsi}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${s.pill}`}
            >
              {s.label}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${st.pill}`}
            >
              {alert.status}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="ml-1 rounded-lg p-1.5 text-[#9aa8c7] hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Description */}
          <p className="text-xs leading-relaxed text-[#a8b5d0]">
            {alert.description}
          </p>

          {/* Detail rows */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={Clock} label="Reported" value={alert.when} />
            <InfoRow icon={Ship} label="Vessel" value={alert.vessel} />
            {alert.mmsi !== "—" && (
              <InfoRow icon={Hash} label="MMSI" value={alert.mmsi} />
            )}
            <InfoRow
              icon={Shield}
              label="Assigned To"
              value={alert.assignedTo}
            />
            <InfoRow
              icon={User}
              label="Resolved By"
              value={alert.resolvedBy}
            />
            <InfoRow
              icon={CheckCircle2}
              label="Acknowledged"
              value={alert.acknowledged ? "Yes" : "No"}
              valueClass={alert.acknowledged ? "text-emerald-300" : "text-amber-300"}
            />
          </div>

          {/* Notes */}
          {alert.notes && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7f8db3]">
                Notes
              </p>
              <p className="mt-1 text-[11px] font-semibold text-white/85">
                {alert.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-5 py-3">
          <span className="text-[11px] text-[#7f8db3]">Alert ID {alert.id}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c9d3ee] hover:bg-white/10 transition-colors"
            >
              Close
            </button>
            {alert.status !== "Resolved" && (
              <button
                type="button"
                className="rounded-lg bg-[#f28c1b] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#d97706] transition-colors"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
