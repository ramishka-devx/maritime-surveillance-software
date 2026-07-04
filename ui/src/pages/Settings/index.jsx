import React from 'react';
import { useSettings } from './hooks/useSettings.js';
import { TabNavigation } from './components/TabNavigation.jsx';
import { GeneralSettings } from './components/GeneralSettings.jsx';
import { ProfileSettings } from './components/ProfileSettings.jsx';
import { NotificationSettings } from './components/NotificationSettings.jsx';
import { SecuritySettings } from './components/SecuritySettings.jsx';
import { SystemSettings } from './components/SystemSettings.jsx';
import { ZoneSettings } from './components/ZoneSettings.jsx';

const Settings = ({ user }) => {
  const {
    activeTab,
    setActiveTab,
    notifications,
    handleNotificationChange,
    settingsTabs,
  } = useSettings();

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex h-[calc(100vh-120px)]">
        
        {/* Left Sidebar for Tabs */}
        <div className="w-64 border-r border-gray-100 bg-gray-50/30 flex flex-col">
          
          <div className="flex-1 p-4 overflow-y-auto">
            <TabNavigation
              tabs={settingsTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto py-4 px-8 bg-white">
          <div className="max-w-4xl">
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
            {activeTab === 'zones' && <ZoneSettings />}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Settings;
