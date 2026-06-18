export function GeneralSettings() {
  return (
    <div>
      <h2 className="text-base font-extrabold text-[#08244a] mb-4">General Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
          <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors focus:bg-white hover:bg-white">
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Time Zone</label>
          <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors focus:bg-white hover:bg-white">
            <option>UTC-8 (Pacific)</option>
            <option>UTC-5 (Eastern)</option>
            <option>UTC+0 (London)</option>
            <option>UTC+1 (Paris)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Date Format</label>
          <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors focus:bg-white hover:bg-white">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );
}
