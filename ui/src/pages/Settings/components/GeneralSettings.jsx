export function GeneralSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
      <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-white font-semibold mb-2">Language</label>
          <p className="text-gray-400 text-sm mb-3">Select your preferred language</p>
          <select className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#f28c1b] focus:outline-none transition-colors">
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Time Zone</label>
          <p className="text-gray-400 text-sm mb-3">Set your local time zone</p>
          <select className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#f28c1b] focus:outline-none transition-colors">
            <option>UTC-8 (Pacific)</option>
            <option>UTC-5 (Eastern)</option>
            <option>UTC+0 (London)</option>
            <option>UTC+1 (Paris)</option>
          </select>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Date Format</label>
          <p className="text-gray-400 text-sm mb-3">Choose your preferred date format</p>
          <select className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#f28c1b] focus:outline-none transition-colors">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );
}
