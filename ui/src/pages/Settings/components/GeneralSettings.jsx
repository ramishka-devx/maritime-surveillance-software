export function GeneralSettings() {
  return (
    <div>
      <h2 className="text-base font-extrabold text-white mb-4">General Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Language</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors">
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Time Zone</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors">
            <option>UTC-8 (Pacific)</option>
            <option>UTC-5 (Eastern)</option>
            <option>UTC+0 (London)</option>
            <option>UTC+1 (Paris)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Date Format</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );
}
