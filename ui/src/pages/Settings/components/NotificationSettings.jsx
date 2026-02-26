function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10">
      <div className="flex-1">
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-text-muted">{description}</div>
      </div>
      <label className="relative inline-block w-10 h-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="opacity-0 w-0 h-0 peer"
        />
        <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
      </label>
    </div>
  );
}

export function NotificationSettings({ notifications, onNotificationChange }) {
  return (
    <div>
      <h2 className="text-base font-extrabold text-white mb-4">Notification Preferences</h2>
      <div className="space-y-3">
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
        <div className="flex items-center justify-between py-2">
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Weekly Reports</div>
            <div className="text-xs text-text-muted">Receive weekly summary reports</div>
          </div>
          <label className="relative inline-block w-10 h-5">
            <input
              type="checkbox"
              checked={notifications.weeklyReports}
              onChange={() => onNotificationChange('weeklyReports')}
              className="opacity-0 w-0 h-0 peer"
            />
            <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
          </label>
        </div>
      </div>
    </div>
  );
}
