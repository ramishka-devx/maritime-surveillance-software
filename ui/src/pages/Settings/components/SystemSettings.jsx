export function SystemSettings() {
  return (
    <div>
      <h2 className="text-base font-extrabold text-[#08244a] mb-4">System Settings</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-800">Monitoring Zones</div>
            <div className="text-xs font-medium text-slate-500">Configure surveillance zones</div>
          </div>
          <span className="bg-[#0b74c9]/10 text-[#0b74c9] px-2.5 py-1 rounded-full text-xs font-bold">15 Active</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <div className="text-sm font-bold text-slate-800">Data Retention</div>
            <div className="text-xs font-medium text-slate-500">Set data storage duration</div>
          </div>
          <select className="bg-slate-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors hover:bg-white">
            <option>30 Days</option>
            <option>90 Days</option>
            <option>180 Days</option>
            <option>1 Year</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Auto-Backup</div>
            <div className="text-xs font-medium text-slate-500">Automatic system backups</div>
          </div>
          <label className="relative inline-block w-10 h-5">
            <input type="checkbox" defaultChecked className="opacity-0 w-0 h-0 peer" />
            <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full peer-checked:bg-[#0b74c9] transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
          </label>
        </div>
      </div>
    </div>
  );
}
