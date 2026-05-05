import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import { AlertCard } from "./AlertCard.jsx";

export function AlertsPanel({ filteredAlerts, alertFilter, setAlertFilter, onAlertClick, isOpen }) {
  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Active Alerts"
    >
      <aside
        aria-hidden={!isOpen}
        className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-extrabold text-[#08244a]">
              Active Alerts
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {filteredAlerts.length} showing
            </div>
          </div>

          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none shadow-sm transition-all hover:border-[#0b74c9]/45 focus:border-[#0b74c9] focus:ring-2 focus:ring-[#0b74c9]/20 sm:w-auto"
          >
            <option value="All">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-4">
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onAlertClick={onAlertClick} />
              ))
            ) : (
              <div className="py-10 text-center text-sm font-medium text-slate-500">
                No active alerts matching filter.
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-xs font-medium text-slate-500 sm:text-left">
          Tip: Click an alert to center the map on the vessel.
        </div>
      </aside>
    </RequestAccessGate>
  );
}
