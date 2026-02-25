import React, { useEffect, useMemo, useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Lock, Cpu } from 'lucide-react';
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

  useEffect(() => {
    if (!canAdmin && activeTab === 'admin') setActiveTab('general');
  }, [activeTab, canAdmin]);

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const settingsTabs = useMemo(() => {
    const base = [
      { id: 'general', label: 'General', icon: SettingsIcon },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'security', label: 'Security', icon: Lock },
      { id: 'system', label: 'System', icon: Cpu },
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
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Settings</h1>
          <p className="text-sm font-semibold text-text-muted">Manage your account and system preferences</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <div className="md:w-48 rounded-2xl border border-white/10 bg-white/5 p-3">
            {settingsTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-base transition-all mb-2 ${
                    activeTab === tab.id
                      ? 'bg-accent-orange/15 text-accent-orange'
                      : 'text-text-muted hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-base font-extrabold text-white mb-4">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-2">Language</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-2">Time Zone</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors">
                      <option>UTC-8 (Pacific)</option>
                      <option>UTC-5 (Eastern)</option>
                      <option>UTC+0 (London)</option>
                      <option>UTC+1 (Paris)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-2">Date Format</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-accent-orange/60 transition-colors">
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
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-base font-extrabold text-white mb-4">Notification Preferences</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">Email Notifications</div>
                      <div className="text-xs text-text-muted">Receive notifications via email</div>
                    </div>
                    <label className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={() => handleNotificationChange('email')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">Push Notifications</div>
                      <div className="text-xs text-text-muted">Receive push notifications in browser</div>
                    </div>
                    <label className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        checked={notifications.push}
                        onChange={() => handleNotificationChange('push')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">Critical Alerts</div>
                      <div className="text-xs text-text-muted">High-priority security incidents</div>
                    </div>
                    <label className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        checked={notifications.criticalAlerts}
                        onChange={() => handleNotificationChange('criticalAlerts')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">Warning Alerts</div>
                      <div className="text-xs text-text-muted">Medium-priority warnings</div>
                    </div>
                    <label className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        checked={notifications.warningAlerts}
                        onChange={() => handleNotificationChange('warningAlerts')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">Weekly Reports</div>
                      <div className="text-xs text-text-muted">Receive weekly summary reports</div>
                    </div>
                    <label className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReports}
                        onChange={() => handleNotificationChange('weeklyReports')}
                        className="opacity-0 w-0 h-0 peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-base font-extrabold text-white mb-4">Security Settings</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div>
                      <div className="text-sm font-bold text-white">Change Password</div>
                      <div className="text-xs text-text-muted">Update your account password</div>
                    </div>
                    <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Change</button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div>
                      <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
                      <div className="text-xs text-text-muted">Add an extra layer of security</div>
                    </div>
                    <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">Enable</button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-bold text-white">Active Sessions</div>
                      <div className="text-xs text-text-muted">Manage your active login sessions</div>
                    </div>
                    <button className="border border-accent-orange hover:bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors" type="button">View</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <h2 className="text-base font-extrabold text-white mb-4">System Settings</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">Monitoring Zones</div>
                      <div className="text-xs text-text-muted">Configure surveillance zones</div>
                    </div>
                    <span className="bg-accent-orange/15 text-accent-orange px-2.5 py-1 rounded-full text-xs font-bold">15 Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <div>
                      <div className="text-sm font-bold text-white">Data Retention</div>
                      <div className="text-xs text-text-muted">Set data storage duration</div>
                    </div>
                    <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent-orange/60 transition-colors">
                      <option>30 Days</option>
                      <option>90 Days</option>
                      <option>180 Days</option>
                      <option>1 Year</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-bold text-white">Auto-Backup</div>
                      <div className="text-xs text-text-muted">Automatic system backups</div>
                    </div>
                    <label className="relative inline-block w-10 h-5">
                      <input type="checkbox" defaultChecked className="opacity-0 w-0 h-0 peer" />
                      <span className="absolute cursor-pointer inset-0 bg-white/10 rounded-full peer-checked:bg-accent-orange transition-colors after:absolute after:content-[''] after:h-4 after:w-4 after:left-0.5 after:top-0.5 after:bg-white after:rounded-full peer-checked:after:translate-x-5 after:transition-transform" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && canAdmin && (
              <div>
                <h2 className="text-base font-extrabold text-white mb-4">Operator Permissions</h2>
                <p className="text-xs text-text-muted mb-4">Select an operator, then grant/revoke feature permissions</p>

                {adminUsersError ? (
                  <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 mb-4">
                    {adminUsersError}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs font-extrabold text-white mb-3">Operators</div>

                    {adminUsersLoading && !adminUsers ? (
                      <div className="text-[10px] text-text-muted">Loading operators…</div>
                    ) : null}

                    <div className="space-y-2 max-h-64 overflow-auto">
                      {operators.map((u) => {
                        const active = String(u.user_id) === String(selectedOperatorId);
                        return (
                          <button
                            key={u.user_id}
                            type="button"
                            onClick={() => setSelectedOperatorId(String(u.user_id))}
                            className={`w-full text-left rounded-lg border px-2.5 py-1.5 transition-colors text-[10px] ${
                              active
                                ? 'border-accent-orange/30 bg-accent-orange/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="font-semibold text-white truncate">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-[9px] text-text-muted truncate">{u.email}</div>
                          </button>
                        );
                      })}
                      {!adminUsersLoading && operators.length === 0 ? (
                        <div className="text-[10px] text-text-muted">No operators found.</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs font-extrabold text-white">Permissions</div>
                        <div className="text-[9px] text-text-muted">
                          {selectedOperator
                            ? `${selectedOperator.first_name} ${selectedOperator.last_name}`
                            : 'Select an operator'}
                        </div>
                      </div>
                    </div>

                    {operatorPermsError ? (
                      <div className="mb-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] text-red-200">
                        {operatorPermsError}
                      </div>
                    ) : null}

                    {selectedOperator && operatorPermsLoading && !operatorPermissions ? (
                      <div className="text-[10px] text-text-muted">Loading permissions…</div>
                    ) : null}

                    {selectedOperator && Array.isArray(operatorPermissions) ? (
                      <div className="space-y-3 max-h-64 overflow-auto">
                        {operatorPermsByModule.map(({ module, perms }) => (
                          <div key={module} className="rounded-lg border border-white/10 bg-white/5 p-2">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2">
                              {module}
                            </div>
                            <div className="space-y-1">
                              {perms.map((p) => {
                                const assigned = Number(p.assigned) === 1;
                                const busy = Number(permBusyId) === Number(p.permission_id);
                                return (
                                  <div
                                    key={p.permission_id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] font-semibold text-white truncate">{p.name}</div>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={busy || operatorPermsLoading}
                                      onClick={() => togglePermission(p)}
                                      className={`text-[9px] font-bold px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                        assigned
                                          ? 'text-red-200 border-red-400/20 bg-red-500/10 hover:bg-red-500/20'
                                          : 'text-green-200 border-green-400/20 bg-green-500/10 hover:bg-green-500/20'
                                      }`}
                                    >
                                      {busy ? '…' : assigned ? 'Revoke' : 'Grant'}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
