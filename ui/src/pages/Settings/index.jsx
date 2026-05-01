import React from 'react';
import { useSettings } from './hooks/useSettings.js';
import { TabNavigation } from './components/TabNavigation.jsx';
import { GeneralSettings } from './components/GeneralSettings.jsx';
import { ProfileSettings } from './components/ProfileSettings.jsx';
import { NotificationSettings } from './components/NotificationSettings.jsx';
import { SecuritySettings } from './components/SecuritySettings.jsx';
import { SystemSettings } from './components/SystemSettings.jsx';

const Settings = ({ user }) => {
  const {
    activeTab,
    setActiveTab,
    notifications,
    handleNotificationChange,
    settingsTabs,
  } = useSettings();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f9fbfd] px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-xl font-extrabold text-[#08244a]">Settings</h1>
          <p className="text-sm font-medium text-slate-500">Manage your account and system preferences</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <TabNavigation
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
