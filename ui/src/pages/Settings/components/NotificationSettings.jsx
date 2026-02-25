function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700">
      <div>
        <h4 className="text-white font-semibold">{label}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <label className="relative inline-block w-12 h-6">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="opacity-0 w-0 h-0 peer"
        />
        <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
      </label>
    </div>
  );
}

export function NotificationSettings({ notifications, onNotificationChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
      <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
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
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Alert Types</h3>
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
          <NotificationToggle
            label="Info Alerts"
            description="Low-priority information updates"
            checked={notifications.infoAlerts}
            onChange={() => onNotificationChange('infoAlerts')}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Reports</h3>
          <NotificationToggle
            label="Weekly Reports"
            description="Receive weekly summary reports"
            checked={notifications.weeklyReports}
            onChange={() => onNotificationChange('weeklyReports')}
          />
        </div>
      </div>
    </div>
  );
}
