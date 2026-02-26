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
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Settings</h1>
          <p className="text-sm font-semibold text-text-muted">Manage your account and system preferences</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <TabNavigation
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
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
    </div>
  );
};

export default Settings;
