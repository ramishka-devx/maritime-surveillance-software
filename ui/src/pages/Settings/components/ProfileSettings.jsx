export function ProfileSettings({ user }) {
  return (
    <div>
      <h2 className="text-base font-extrabold text-[#08244a] mb-4">Profile Settings</h2>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0b74c9] to-[#085a9c] rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <button className="border border-gray-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Change Avatar</button>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors focus:bg-white hover:bg-white"
            defaultValue={user?.name || ''}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
          <input
            type="email"
            className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors focus:bg-white hover:bg-white"
            defaultValue={user?.email || ''}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
          <input
            type="tel"
            className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0b74c9] focus:ring-1 focus:ring-[#0b74c9] transition-colors focus:bg-white hover:bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <button className="bg-[#0b74c9] hover:bg-[#095ca5] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm" type="button">Save Changes</button>
      </div>
    </div>
  );
}
