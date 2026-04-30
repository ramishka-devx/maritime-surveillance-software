import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import { AlertCard } from "./AlertCard.jsx";

export function AlertsPanel({ filteredAlerts, alertFilter, setAlertFilter, onAlertClick }) {
  return (
    <RequestAccessGate
      permission="dashboard.view"
      featureName="Active Alerts"
    >
      <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col h-full w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 bg-gray-50 px-4 sm:px-5 py-3 sm:py-4 shrink-0 gap-3 sm:gap-0">
          <div>
            <div className="text-sm font-extrabold text-[#08244a]">
              Active Alerts
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              {filteredAlerts.length} showing
            </div>
          </div>

          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-[#0b74c9] focus:border-[#0b74c9] focus:ring-2 focus:ring-[#0b74c9]/20 transition-all shadow-sm cursor-pointer"
          >
            <option value="All">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onAlertClick={onAlertClick} />
              ))
            ) : (
              <div className="text-center text-slate-500 py-10 text-sm font-medium">
                No active alerts matching filter.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-5 py-3 text-xs font-medium text-slate-500 shrink-0 text-center sm:text-left">
          Tip: Click an alert to center the map on the vessel.
        </div>
      </aside>
    </RequestAccessGate>
  );
}
