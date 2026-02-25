import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

const Settings = ({ user }) => {
  const { token, isSuperAdmin } = useAuth();
  const canAdmin = isSuperAdmin();

  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    weeklyReports: true,
  });

  const [adminUsers, setAdminUsers] = useState(null);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');

  const [operatorPermissions, setOperatorPermissions] = useState(null);
  const [operatorPermsLoading, setOperatorPermsLoading] = useState(false);
  const [operatorPermsError, setOperatorPermsError] = useState('');
  const [permBusyId, setPermBusyId] = useState(null);

  // Prevent landing on Admin tab if not allowed.
  useEffect(() => {
    if (!canAdmin && activeTab === 'admin') setActiveTab('general');
  }, [activeTab, canAdmin]);

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const settingsTabs = useMemo(() => {
    const base = [
      { id: 'general', label: 'General', icon: '⚙️' },
      { id: 'profile', label: 'Profile', icon: '👤' },
      { id: 'notifications', label: 'Notifications', icon: '🔔' },
      { id: 'security', label: 'Security', icon: '🔒' },
      { id: 'system', label: 'System', icon: '💻' },
    ];
    return base;
  }, [canAdmin]);

  const operators = useMemo(() => {
    const rows = Array.isArray(adminUsers?.rows) ? adminUsers.rows : [];
    return rows
      .filter((u) => String(u.role || '').toLowerCase() === 'operator' || Number(u.role_id) === 2)
      .sort((a, b) => {
        const an = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        const bn = `${b.first_name || ''} ${b.last_name || ''}`.trim();
        return an.localeCompare(bn);
      });
  }, [adminUsers]);

  const selectedOperator = useMemo(() => {
    if (!selectedOperatorId) return null;
    return operators.find((u) => String(u.user_id) === String(selectedOperatorId)) || null;
  }, [operators, selectedOperatorId]);

  // Load operators list when Admin tab is opened.
  useEffect(() => {
    if (!canAdmin) return;
    if (activeTab !== 'admin') return;
    if (!token) return;
    if (adminUsers) return;

    let cancelled = false;
    setAdminUsersLoading(true);
    setAdminUsersError('');

    (async () => {
      try {
        const data = await apiRequest('/api/users?page=1&limit=200', { token });
        if (!cancelled) setAdminUsers(data);
      } catch (e) {
        if (!cancelled) setAdminUsersError(e?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setAdminUsersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, adminUsers, adminUsersLoading, canAdmin, token]);

  // Load selected operator permissions.
  useEffect(() => {
    if (!canAdmin) return;
    if (activeTab !== 'admin') return;
    if (!token) return;
    if (!selectedOperatorId) {
      setOperatorPermissions(null);
      setOperatorPermsError('');
      return;
    }

    let cancelled = false;
    setOperatorPermsLoading(true);
    setOperatorPermsError('');

    (async () => {
      try {
        const data = await apiRequest(`/api/users/${selectedOperatorId}/permissions`, { token });
        if (!cancelled) setOperatorPermissions(data);
      } catch (e) {
        if (!cancelled) setOperatorPermsError(e?.message || 'Failed to load permissions');
      } finally {
        if (!cancelled) setOperatorPermsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, canAdmin, selectedOperatorId, token]);

  const operatorPermsByModule = useMemo(() => {
    const rows = Array.isArray(operatorPermissions) ? operatorPermissions : [];
    const grouped = {};
    for (const p of rows) {
      const module = p.module || 'other';
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(p);
    }

    const ordered = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, perms]) => ({
        module,
        perms: perms.sort((x, y) => String(x.name || '').localeCompare(String(y.name || ''))),
      }));
    return ordered;
  }, [operatorPermissions]);

  async function togglePermission(permission) {
    if (!canAdmin) return;
    if (!token) return;
    if (!selectedOperatorId) return;

    const permId = Number(permission?.permission_id);
    if (!Number.isFinite(permId)) return;

    const currentlyAssigned = Number(permission?.assigned) === 1;
    const endpoint = currentlyAssigned
      ? `/api/users/${selectedOperatorId}/permissions/revoke`
      : `/api/users/${selectedOperatorId}/permissions/assign`;

    setPermBusyId(permId);
    setOperatorPermsError('');

    try {
      await apiRequest(endpoint, {
        token,
        method: 'POST',
        body: { permission_id: permId },
      });

      // Update UI without a full refetch.
      setOperatorPermissions((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((p) =>
          Number(p.permission_id) === permId
            ? { ...p, assigned: currentlyAssigned ? 0 : 1 }
            : p,
        );
      });
    } catch (e) {
      setOperatorPermsError(e?.message || 'Failed to update permission');
    } finally {
      setPermBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e]">
      <div className="bg-gradient-to-r from-[#0b1220] to-[#111b2e] p-8 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and system preferences</p>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="md:w-56 bg-[#1a2942] border-r border-gray-700 p-4">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 mb-2 ${
                activeTab === tab.id
                  ? 'bg-[#f28c1b] text-white'
                  : 'text-gray-400 hover:bg-[#243b78] hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
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
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
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
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
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
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
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
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
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
                      <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
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
                  <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Change</button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <h4 className="text-white font-semibold">Two-Factor Authentication</h4>
                    <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                  </div>
                  <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Enable</button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <h4 className="text-white font-semibold">Active Sessions</h4>
                    <p className="text-gray-400 text-sm">Manage your active login sessions</p>
                  </div>
                  <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">View</button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-white font-semibold">Login History</h4>
                    <p className="text-gray-400 text-sm">Review your recent login activity</p>
                  </div>
                  <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">View History</button>
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
                  <select className="bg-[#0b1220] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#f28c1b] focus:outline-none transition-colors">
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
                    <span className="absolute cursor-pointer inset-0 bg-gray-600 rounded-full peer-checked:bg-[#f28c1b] transition-colors after:absolute after:content-[''] after:h-5 after:w-5 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-6 after:transition-transform" />
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-white font-semibold">System Version</h4>
                    <p className="text-gray-400 text-sm">SerenGuard v1.0.0</p>
                  </div>
                  <button className="border border-[#f28c1b] hover:bg-[#f28c1b] text-white px-4 py-2 rounded-lg font-semibold transition-colors" type="button">Check Updates</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && canAdmin && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Admin</h2>

              <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Operator Permissions</h3>
                  <p className="text-gray-400 text-sm">
                    Select an operator, then grant/revoke feature permissions (for example: <span className="text-white font-semibold">ais.view</span>).
                  </p>
                </div>

                {adminUsersError ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {adminUsersError}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-gray-700 bg-[#0b1220] p-4">
                    <div className="text-white font-semibold mb-3">Operators</div>

                    {adminUsersLoading && !adminUsers ? (
                      <div className="text-sm text-gray-400">Loading operators…</div>
                    ) : null}

                    <div className="space-y-2 max-h-96 overflow-auto pr-1">
                      {operators.map((u) => {
                        const active = String(u.user_id) === String(selectedOperatorId);
                        return (
                          <button
                            key={u.user_id}
                            type="button"
                            onClick={() => setSelectedOperatorId(String(u.user_id))}
                            className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                              active
                                ? 'border-[#f28c1b]/50 bg-[#243b78]'
                                : 'border-gray-800 bg-[#111b2e] hover:bg-[#162341]'
                            }`}
                          >
                            <div className="text-sm font-semibold text-white truncate">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{u.email}</div>
                          </button>
                        );
                      })}
                      {!adminUsersLoading && operators.length === 0 ? (
                        <div className="text-sm text-gray-400">No operators found.</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-700 bg-[#0b1220] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">Permissions</div>
                        <div className="text-xs text-gray-400">
                          {selectedOperator
                            ? `Managing: ${selectedOperator.first_name} ${selectedOperator.last_name}`
                            : 'Select an operator to manage permissions.'}
                        </div>
                      </div>
                    </div>

                    {operatorPermsError ? (
                      <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {operatorPermsError}
                      </div>
                    ) : null}

                    {selectedOperator && operatorPermsLoading && !operatorPermissions ? (
                      <div className="text-sm text-gray-400">Loading permissions…</div>
                    ) : null}

                    {selectedOperator && Array.isArray(operatorPermissions) ? (
                      <div className="space-y-4 max-h-96 overflow-auto pr-1">
                        {operatorPermsByModule.map(({ module, perms }) => (
                          <div key={module} className="rounded-lg border border-gray-800 bg-[#111b2e] p-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                              {module}
                            </div>

                            <div className="space-y-2">
                              {perms.map((p) => {
                                const assigned = Number(p.assigned) === 1;
                                const busy = Number(permBusyId) === Number(p.permission_id);
                                return (
                                  <div
                                    key={p.permission_id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#0b1220] px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                                      {p.description ? (
                                        <div className="text-xs text-gray-400 truncate">{p.description}</div>
                                      ) : null}
                                    </div>

                                    <button
                                      type="button"
                                      disabled={busy || operatorPermsLoading}
                                      onClick={() => togglePermission(p)}
                                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                                        assigned
                                          ? 'text-red-200 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                                          : 'text-green-200 border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                                      }`}
                                    >
                                      {busy ? 'Working…' : assigned ? 'Revoke' : 'Grant'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
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
