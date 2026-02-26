export function SystemSettings() {
  return (
    <div>
      <h2 className="text-base font-extrabold text-white mb-4">System Settings</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Monitoring Zones</div>
            <div className="text-xs text-text-muted">Configure surveillance zones</div>
          </div>
          <span className="bg-accent-orange/15 text-accent-orange px-2.5 py-1 rounded-full text-xs font-bold">15 Active</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <div>
            <div className="text-sm font-bold text-white">Data Retention</div>
            <div className="text-xs text-text-muted">Set data storage duration</div>
          </div>
          <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent-orange/60 transition-colors">
            <option>30 Days</option>
            <option>90 Days</option>
            <option>180 Days</option>
            <option>1 Year</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-bold text-white">Auto-Backup</div>
            <div className="text-xs text-text-muted">Automatic system backups</div>
          </div>
          <label className="relative inline-block w-10 h-5">
            <input type="checkbox" defaultChecked className="opacity-0 w-0 h-0 peer" />
            <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
          </label>
        </div>
      </div>
    </div>
  );
}
