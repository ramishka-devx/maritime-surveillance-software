import { useState } from 'react';
import { Settings, User, Bell, Lock, Cpu } from 'lucide-react';

export function useSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    weeklyReports: true,
  });

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'system', label: 'System', icon: Cpu },
  ];

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    activeTab,
    setActiveTab,
    notifications,
    handleNotificationChange,
    settingsTabs,
  };
}
