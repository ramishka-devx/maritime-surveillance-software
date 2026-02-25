export function ProfileSettings({ user }) {
  return (
    <div>
      <h2 className="text-base font-extrabold text-white mb-4">Profile Settings</h2>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-[#d97706] rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Change Avatar</button>
        </div>
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Full Name</label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors"
            defaultValue={user?.name || ''}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Email Address</label>
          <input
            type="email"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors"
            defaultValue={user?.email || ''}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white/80 mb-2">Phone Number</label>
          <input
            type="tel"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-2 rounded-lg font-semibold text-sm transition-colors" type="button">Save Changes</button>
      </div>
    </div>
  );
}
