export function ProfileSettings({ user }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
      <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
        <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-700">
          <div className="w-24 h-24 bg-gradient-to-br from-[#f28c1b] to-[#d97a0a] rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Change Avatar</button>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Full Name</label>
          <input
            type="text"
            className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#f28c1b] focus:outline-none transition-colors"
            defaultValue={user?.name || ''}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Email Address</label>
          <input
            type="email"
            className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#f28c1b] focus:outline-none transition-colors"
            defaultValue={user?.email || ''}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Phone Number</label>
          <input
            type="tel"
            className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#f28c1b] focus:outline-none transition-colors"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Organization</label>
          <input
            type="text"
            className="w-full bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#f28c1b] focus:outline-none transition-colors"
            placeholder="SerenGuard Maritime Security"
          />
        </div>

        <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Save Changes</button>
      </div>
    </div>
  );
}
