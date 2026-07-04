export function GeneralSettings() {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#1b397e] mb-6">General Settings</h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-semibold outline-none focus:border-[#1b397e] focus:ring-1 focus:ring-[#1b397e] transition-colors focus:bg-white hover:bg-white">
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Time Zone</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-semibold outline-none focus:border-[#1b397e] focus:ring-1 focus:ring-[#1b397e] transition-colors focus:bg-white hover:bg-white">
            <option>UTC-8 (Pacific)</option>
            <option>UTC-5 (Eastern)</option>
            <option>UTC+0 (London)</option>
            <option>UTC+1 (Paris)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Date Format</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-semibold outline-none focus:border-[#1b397e] focus:ring-1 focus:ring-[#1b397e] transition-colors focus:bg-white hover:bg-white">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );
}
