import RequestAccessGate from "../../../components/RequestAccessGate.jsx";
import { AlertCard } from "./AlertCard.jsx";

export function AlertsPanel({ alerts, filteredAlerts, alertFilter, setAlertFilter }) {
  return (
    <RequestAccessGate
      permission="dashboard.active_alerts.view"
      featureName="Active Alerts"
    >
      <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-4 py-3">
          <div>
            <div className="text-sm font-bold text-white">
              Active Alerts
            </div>
            <div className="text-[11px] text-[#9aa8c7]">
              {filteredAlerts.length} showing
            </div>
          </div>

          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9d3ee] outline-none"
          >
            <option value="All" className="bg-[#0b1220] text-white">All</option>
            <option value="Critical" className="bg-[#0b1220] text-white">Critical</option>
            <option value="High" className="bg-[#0b1220] text-white">High</option>
            <option value="Medium" className="bg-[#0b1220] text-white">Medium</option>
            <option value="Low" className="bg-[#0b1220] text-white">Low</option>
          </select>
        </div>

        <div className="max-h-[72vh] min-h-[520px] overflow-y-auto p-3">
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 px-4 py-3 text-[11px] text-[#9aa8c7]">
          Tip: Click an alert to center the map on the vessel.
        </div>
      </aside>
    </RequestAccessGate>
  );
}
