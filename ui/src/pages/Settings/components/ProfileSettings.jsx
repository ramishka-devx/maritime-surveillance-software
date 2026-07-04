export function ProfileSettings({ user }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#1b397e] mb-6">Profile Settings</h2>
      <div className="space-y-5">
        <div className="flex flex-col items-start gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1b397e] to-[#132c66] rounded-full flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <button className="border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg font-semibold text-sm transition-colors" type="button">Change Avatar</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-semibold placeholder-gray-400 outline-none focus:border-[#1b397e] focus:ring-1 focus:ring-[#1b397e] transition-colors focus:bg-white hover:bg-white"
            defaultValue={user?.name || ''}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-semibold placeholder-gray-400 outline-none focus:border-[#1b397e] focus:ring-1 focus:ring-[#1b397e] transition-colors focus:bg-white hover:bg-white"
            defaultValue={user?.email || ''}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-semibold placeholder-gray-400 outline-none focus:border-[#1b397e] focus:ring-1 focus:ring-[#1b397e] transition-colors focus:bg-white hover:bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="pt-2">
          <button className="bg-[#1b397e] hover:bg-[#132c66] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm" type="button">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
