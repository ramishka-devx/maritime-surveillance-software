export function SecuritySettings() {
  return (
    <div>
      <h2 className="text-base font-extrabold text-white mb-4">Security Settings</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <div>
            <div className="text-sm font-bold text-white">Change Password</div>
            <div className="text-xs text-text-muted">Update your account password</div>
          </div>
          <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Change</button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <div>
            <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
            <div className="text-xs text-text-muted">Add an extra layer of security</div>
          </div>
          <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Enable</button>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-bold text-white">Active Sessions</div>
            <div className="text-xs text-text-muted">Manage your active login sessions</div>
          </div>
          <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">View</button>
        </div>
      </div>
    </div>
  );
}
