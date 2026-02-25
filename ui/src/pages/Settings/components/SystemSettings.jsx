export function SystemSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">System Settings</h2>
      <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div>
            <h4 className="text-white font-semibold">Monitoring Zones</h4>
            <p className="text-gray-400 text-sm">Configure surveillance zones</p>
          </div>
          <span className="bg-[#243b78] text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">15 Active</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div>
            <h4 className="text-white font-semibold">Data Retention</h4>
            <p className="text-gray-400 text-sm">Set data storage duration</p>
          </div>
          <select className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#f28c1b] focus:outline-none transition-colors">
            <option>30 Days</option>
            <option>90 Days</option>
            <option>180 Days</option>
            <option>1 Year</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div>
            <h4 className="text-white font-semibold">Auto-Backup</h4>
            <p className="text-gray-400 text-sm">Automatic system backups</p>
          </div>
          <label className="relative inline-block w-12 h-6">
            <input type="checkbox" defaultChecked className="opacity-0 w-0 h-0 peer" />
            <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
          </label>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <h4 className="text-white font-semibold">System Version</h4>
            <p className="text-gray-400 text-sm">SerenGuard v1.0.0</p>
          </div>
          <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Check Updates</button>
        </div>
      </div>
    </div>
  );
}
