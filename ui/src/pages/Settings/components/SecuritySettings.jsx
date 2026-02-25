export function SecuritySettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
      <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div>
            <h4 className="text-white font-semibold">Change Password</h4>
            <p className="text-gray-400 text-sm">Update your account password</p>
          </div>
          <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Change</button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div>
            <h4 className="text-white font-semibold">Two-Factor Authentication</h4>
            <p className="text-gray-400 text-sm">Add an extra layer of security</p>
          </div>
          <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Enable</button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-700">
          <div>
            <h4 className="text-white font-semibold">Active Sessions</h4>
            <p className="text-gray-400 text-sm">Manage your active login sessions</p>
          </div>
          <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">View</button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <h4 className="text-white font-semibold">Login History</h4>
            <p className="text-gray-400 text-sm">Review your recent login activity</p>
          </div>
          <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">View History</button>
        </div>
      </div>
    </div>
  );
}
