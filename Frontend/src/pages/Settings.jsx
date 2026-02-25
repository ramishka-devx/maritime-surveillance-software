import React, { useState } from 'react';

const Settings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    weeklyReports: true,
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0b1220] to-[#111b2e] p-8 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and system preferences</p>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="md:w-48 bg-[#1a2942] border-r border-gray-700 p-4">
          {[
            { id: 'general', label: 'General' },
            { id: 'profile', label: 'Profile' },
            { id: 'notifications', label: 'Notifications'},
            { id: 'security', label: 'Security'},
            { id: 'system', label: 'System'},
          ].map((tab) => (
            <button 
              key={tab.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 mb-2 ${
                activeTab === tab.id 
                  ? 'bg-[#d97706] text-white' 
                  : 'text-gray-400 hover:bg-[#d97706] hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {activeTab === 'general' && (
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
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
              <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
                <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-700">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#f28c1b] to-[#d97a0a] rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">Change Avatar</button>
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

                <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
              <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-white font-semibold">Email Notifications</h4>
                      <p className="text-gray-400 text-sm">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        checked={notifications.email}
                        onChange={() => handleNotificationChange('email')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-white font-semibold">Push Notifications</h4>
                      <p className="text-gray-400 text-sm">Receive push notifications in browser</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        checked={notifications.push}
                        onChange={() => handleNotificationChange('push')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Alert Types</h3>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-white font-semibold">Critical Alerts</h4>
                      <p className="text-gray-400 text-sm">High-priority security incidents</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        checked={notifications.criticalAlerts}
                        onChange={() => handleNotificationChange('criticalAlerts')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-white font-semibold">Warning Alerts</h4>
                      <p className="text-gray-400 text-sm">Medium-priority warnings</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        checked={notifications.warningAlerts}
                        onChange={() => handleNotificationChange('warningAlerts')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-white font-semibold">Info Alerts</h4>
                      <p className="text-gray-400 text-sm">Low-priority information updates</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        checked={notifications.infoAlerts}
                        onChange={() => handleNotificationChange('infoAlerts')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Reports</h3>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-white font-semibold">Weekly Reports</h4>
                      <p className="text-gray-400 text-sm">Receive weekly summary reports</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        checked={notifications.weeklyReports}
                        onChange={() => handleNotificationChange('weeklyReports')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
              <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <h4 className="text-white font-semibold">Change Password</h4>
                    <p className="text-gray-400 text-sm">Update your account password</p>
                  </div>
                  <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">Change</button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <h4 className="text-white font-semibold">Two-Factor Authentication</h4>
                    <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                  </div>
                  <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">Enable</button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <h4 className="text-white font-semibold">Active Sessions</h4>
                    <p className="text-gray-400 text-sm">Manage your active login sessions</p>
                  </div>
                  <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">View</button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-white font-semibold">Login History</h4>
                    <p className="text-gray-400 text-sm">Review your recent login activity</p>
                  </div>
                  <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">View History</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
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
                  <select className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#d97706] focus:outline-none transition-colors">
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
                    <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-white font-semibold">System Version</h4>
                    <p className="text-gray-400 text-sm">SerenGuard v1.0.0</p>
                  </div>
                  <button className="border border-[#d97706] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-semibold transition-colors">Check Updates</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
