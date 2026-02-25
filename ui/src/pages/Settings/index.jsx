import React, { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useSettings } from './hooks/useSettings.js';
import { TabNavigation } from './components/TabNavigation.jsx';
import { GeneralSettings } from './components/GeneralSettings.jsx';
import { ProfileSettings } from './components/ProfileSettings.jsx';
import { NotificationSettings } from './components/NotificationSettings.jsx';
import { SecuritySettings } from './components/SecuritySettings.jsx';
import { SystemSettings } from './components/SystemSettings.jsx';
import { AdminTabContent } from './components/AdminTabContent.jsx';

const Settings = ({ user }) => {
  const { token, isSuperAdmin } = useAuth();
  const canAdmin = isSuperAdmin();

  const {
    activeTab,
    setActiveTab,
    notifications,
    handleNotificationChange,
    settingsTabs,
  } = useSettings(canAdmin);

  // Prevent landing on Admin tab if not allowed.
  useEffect(() => {
    if (!canAdmin && activeTab === 'admin') setActiveTab('general');
  }, [activeTab, canAdmin, setActiveTab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e]">
      <div className="bg-gradient-to-r from-[#0b1220] to-[#111b2e] p-8 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and system preferences</p>
      </div>

      <div className="flex flex-col md:flex-row">
        <TabNavigation
          tabs={settingsTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 p-8">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'notifications' && (
            <NotificationSettings
              notifications={notifications}
              onNotificationChange={handleNotificationChange}
            />
          )}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'system' && <SystemSettings />}
          {activeTab === 'admin' && canAdmin && (
            <AdminTabContent token={token} canAdmin={canAdmin} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
