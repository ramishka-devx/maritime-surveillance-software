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
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className={`mt-0.5 text-xs font-semibold text-slate-800 ${valueClass}`}>{value || "—"}</p>
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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-md"
      onClick={handleClose}
    >
      {/* Modal panel */}
      <div
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border shadow-sm ${s.pill.replace('text-white', '').replace('bg-', 'bg-opacity-20 text-')}`}
            >
              <SeverityIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#08244a] leading-snug">
                {alert.title}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {alert.vessel} {alert.mmsi !== "—" ? `• MMSI ${alert.mmsi}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${s.pill.replace('text-white', 'text-slate-800 bg-opacity-20')}`}
            >
              {s.label}
            </span>
            <span
              className={`rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${st.pill.replace('text-white', 'text-slate-800 bg-opacity-20')}`}
            >
              {alert.status}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Description */}
          <p className="text-sm font-medium leading-relaxed text-slate-600">
            {alert.description}
          </p>

          {/* Detail rows */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
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
              valueClass={alert.acknowledged ? "text-emerald-600" : "text-amber-600"}
            />
          </div>

          {/* Notes */}
          {alert.notes && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0b74c9]">
                Notes
              </p>
              <p className="mt-1.5 text-xs font-semibold text-slate-700">
                {alert.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <span className="text-xs font-medium text-slate-500">Alert ID {alert.id}</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-gray-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              Close
            </button>
            {alert.status !== "Resolved" && (
              <button
                type="button"
                className="rounded-lg border border-transparent bg-[#0b74c9] px-4 py-2 text-xs font-bold text-white hover:bg-[#08244a] transition-all shadow-sm"
              >
                Acknowledge / Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
