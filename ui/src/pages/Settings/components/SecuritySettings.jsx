export function SecuritySettings() {
  return (
    <div>
      <h2 className="text-base font-extrabold text-[#08244a] mb-4">Security Settings</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <div className="text-sm font-bold text-slate-800">Change Password</div>
            <div className="text-xs font-medium text-slate-500">Update your account password</div>
          </div>
          <button className="border border-gray-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Change</button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <div className="text-sm font-bold text-slate-800">Two-Factor Authentication</div>
            <div className="text-xs font-medium text-slate-500">Add an extra layer of security</div>
          </div>
          <button className="border border-[#0b74c9] hover:bg-[#0b74c9]/5 text-[#0b74c9] px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Enable</button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Active Sessions</div>
            <div className="text-xs font-medium text-slate-500">Manage your active login sessions</div>
          </div>
          <button className="border border-gray-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">View</button>
        </div>
      </div>
    </div>
  );
}
