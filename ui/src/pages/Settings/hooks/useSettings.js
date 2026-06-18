import { useState } from 'react';
import { Settings, User, Bell, Lock, Cpu, Map } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';

export function useSettings() {
  const { isSuperAdmin } = useAuth();
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

  if (isSuperAdmin()) {
    settingsTabs.push({ id: 'zones', label: 'Restricted Zones', icon: Map });
  }

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
