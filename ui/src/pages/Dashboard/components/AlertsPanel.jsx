import { AlertCard } from "./AlertCard.jsx";

export function AlertsPanel({ filteredAlerts, onAlertClick }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-800">Recent Alerts</h3>
        <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
          Live
        </span>
      </div>

      {/* List */}
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-0">
        <div className="flex flex-col divide-y divide-gray-100">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.slice(0, 3).map((alert) => (
              <AlertCard key={alert.id} alert={alert} onAlertClick={onAlertClick} />
            ))
          ) : (
            <div className="py-10 text-center text-sm font-medium text-slate-500">
              No recent alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
