function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-800">{label}</div>
        <div className="text-xs font-medium text-slate-500">{description}</div>
      </div>
      <label className="relative inline-block w-10 h-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="opacity-0 w-0 h-0 peer"
        />
        <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full peer-checked:bg-[#0b74c9] transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
      </label>
    </div>
  );
}

export function NotificationSettings({ notifications, onNotificationChange }) {
  return (
    <div>
      <h2 className="text-base font-extrabold text-[#08244a] mb-4">Notification Preferences</h2>
      <div className="space-y-1">
        <NotificationToggle
          label="Email Notifications"
          description="Receive notifications via email"
          checked={notifications.email}
          onChange={() => onNotificationChange('email')}
        />
        <NotificationToggle
          label="Push Notifications"
          description="Receive push notifications in browser"
          checked={notifications.push}
          onChange={() => onNotificationChange('push')}
        />
        <NotificationToggle
          label="Critical Alerts"
          description="High-priority security incidents"
          checked={notifications.criticalAlerts}
          onChange={() => onNotificationChange('criticalAlerts')}
        />
        <NotificationToggle
          label="Warning Alerts"
          description="Medium-priority warnings"
          checked={notifications.warningAlerts}
          onChange={() => onNotificationChange('warningAlerts')}
        />
        <div className="flex items-center justify-between py-3">
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-800">Weekly Reports</div>
            <div className="text-xs font-medium text-slate-500">Receive weekly summary reports</div>
          </div>
          <label className="relative inline-block w-10 h-5">
            <input
              type="checkbox"
              checked={notifications.weeklyReports}
              onChange={() => onNotificationChange('weeklyReports')}
              className="opacity-0 w-0 h-0 peer"
            />
            <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full peer-checked:bg-[#0b74c9] transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
          </label>
        </div>
      </div>
    </div>
  );
}
