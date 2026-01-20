import React, { useState } from 'react';
import './Settings.css';

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
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">Manage your account and system preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={activeTab === 'general' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('general')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6m5.656-16.656l-1.414 1.414M7.758 16.242l-1.414 1.414M1 12h6m6 0h6m-16.656 5.656l1.414-1.414M16.242 7.758l1.414-1.414" stroke="currentColor" strokeWidth="2"/>
            </svg>
            General
          </button>

          <button 
            className={activeTab === 'profile' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('profile')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Profile
          </button>

          <button 
            className={activeTab === 'notifications' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('notifications')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Notifications
          </button>

          <button 
            className={activeTab === 'security' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('security')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Security
          </button>

          <button 
            className={activeTab === 'system' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('system')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            System
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              
              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Language</h3>
                    <p>Select your preferred language</p>
                  </div>
                  <select className="setting-select">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Time Zone</h3>
                    <p>Set your local time zone</p>
                  </div>
                  <select className="setting-select">
                    <option>UTC-8 (Pacific)</option>
                    <option>UTC-5 (Eastern)</option>
                    <option>UTC+0 (London)</option>
                    <option>UTC+1 (Paris)</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Date Format</h3>
                    <p>Choose your preferred date format</p>
                  </div>
                  <select className="setting-select">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Settings</h2>
              
              <div className="setting-card">
                <div className="profile-avatar-section">
                  <div className="profile-avatar-large">
                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <button className="btn-primary">Change Avatar</button>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Full Name</label>
                  <input 
                    type="text" 
                    className="setting-input" 
                    defaultValue={user?.name || ''} 
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Email Address</label>
                  <input 
                    type="email" 
                    className="setting-input" 
                    defaultValue={user?.email || ''} 
                    placeholder="Enter your email"
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="setting-input" 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="setting-item">
                  <label className="setting-label">Organization</label>
                  <input 
                    type="text" 
                    className="setting-input" 
                    placeholder="SerenGuard Maritime Security"
                  />
                </div>

                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              
              <div className="setting-card">
                <h3 className="section-title">Notification Channels</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Email Notifications</h3>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Push Notifications</h3>
                    <p>Receive push notifications in browser</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <h3 className="section-title">Alert Types</h3>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Critical Alerts</h3>
                    <p>High-priority security incidents</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.criticalAlerts}
                      onChange={() => handleNotificationChange('criticalAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Warning Alerts</h3>
                    <p>Medium-priority warnings</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.warningAlerts}
                      onChange={() => handleNotificationChange('warningAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Info Alerts</h3>
                    <p>Low-priority information updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.infoAlerts}
                      onChange={() => handleNotificationChange('infoAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <h3 className="section-title">Reports</h3>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Weekly Reports</h3>
                    <p>Receive weekly summary reports</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.weeklyReports}
                      onChange={() => handleNotificationChange('weeklyReports')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              
              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Change Password</h3>
                    <p>Update your account password</p>
                  </div>
                  <button className="btn-primary">Change</button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security</p>
                  </div>
                  <button className="btn-primary">Enable</button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Active Sessions</h3>
                    <p>Manage your active login sessions</p>
                  </div>
                  <button className="btn-primary">View</button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Login History</h3>
                    <p>Review your recent login activity</p>
                  </div>
                  <button className="btn-primary">View History</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-section">
              <h2>System Settings</h2>
              
              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Monitoring Zones</h3>
                    <p>Configure surveillance zones</p>
                  </div>
                  <span className="setting-badge">15 Active</span>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Data Retention</h3>
                    <p>Set data storage duration</p>
                  </div>
                  <select className="setting-select">
                    <option>30 Days</option>
                    <option>90 Days</option>
                    <option>180 Days</option>
                    <option>1 Year</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Auto-Backup</h3>
                    <p>Automatic system backups</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>System Version</h3>
                    <p>SerenGuard v1.0.0</p>
                  </div>
                  <button className="btn-primary">Check Updates</button>
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
