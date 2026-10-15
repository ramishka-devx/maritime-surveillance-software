import React, { useState, useMemo, useEffect, useCallback } from 'react';
import RolesHeaderBar from '../../components/roles/RolesHeaderBar.jsx';
import RolesRosterList from '../../components/roles/RolesRosterList.jsx';
import RolesPermissionsMatrix from '../../components/roles/RolesPermissionsMatrix.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';

function normalizeRole(r) {
  const roleId = r.role_id ?? r.id;
  const isSuperAdmin = r.name === 'super_admin';
  const isSystem = r.is_system === 1 || r.is_system === true;
  return {
    ...r,
    id: roleId,
    role_id: roleId,
    name: r.name,
    is_system: isSystem ? 1 : 0,
    dotColor: isSuperAdmin ? 'bg-amber-400' : isSystem ? 'bg-purple-400' : 'bg-cyan-400',
    usersCount: r.user_count ?? r.users_count ?? r.usersCount ?? 0,
    isLocked: isSuperAdmin,
    description: r.description || '',
  };
}



export default function RolesPermissionsPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Live Permissions State (stored as Set of permission_id)
  const [permissionsList, setPermissionsList] = useState([]);
  const [activePermissionIds, setActivePermissionIds] = useState(new Set());
  const [baselinePermissionIds, setBaselinePermissionIds] = useState(new Set());
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  // Live Role Assigned Users State
  const [roleUsers, setRoleUsers] = useState([]);
  const [roleUsersTotal, setRoleUsersTotal] = useState(null);
  const [isLoadingRoleUsers, setIsLoadingRoleUsers] = useState(false);

  // New Role Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    tier: 'Specialist // L-2',
    description: '',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // 1. Fetch all live roles (including real user counts from stats endpoint)
  const fetchRoles = useCallback(
    async (preferredRoleId) => {
      if (!token) return;
      setIsLoadingRoles(true);
      try {
        let roleList = [];
        try {
          const statsData = await apiRequest('/api/roles/stats/overview', { token });
          if (Array.isArray(statsData) && statsData.length > 0) {
            roleList = statsData;
          }
        } catch {
          // Fallback if user does not have roles.list for stats
        }

        if (roleList.length === 0) {
          const data = await apiRequest('/api/roles/all', { token });
          roleList = Array.isArray(data) ? data : data?.rows || [];
        }

        const normalized = roleList.map(normalizeRole);
        setRoles(normalized);
        if (normalized.length > 0) {
          setSelectedRoleId((prev) => {
            const target = preferredRoleId || prev;
            const exists = normalized.some((r) => String(r.id) === String(target));
            return exists ? target : normalized[0].id;
          });
        }
      } catch (err) {
        console.error('Failed to fetch live roles:', err);
        showToast(err.message || 'Error loading live roles from backend');
      } finally {
        setIsLoadingRoles(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // 2. Fetch live permissions whenever selectedRoleId changes
  const fetchPermissions = useCallback(async () => {
    if (!token || !selectedRoleId) return;
    setIsLoadingPermissions(true);
    try {
      const data = await apiRequest(`/api/roles/${selectedRoleId}/permissions/all`, { token });
      const perms = Array.isArray(data) ? data : data?.rows || [];
      setPermissionsList(perms);

      const assignedIds = new Set(
        perms
          .filter((p) => p.assigned === 1 || p.assigned === true)
          .map((p) => p.permission_id)
      );

      setActivePermissionIds(assignedIds);
      setBaselinePermissionIds(new Set(assignedIds));
    } catch (err) {
      console.error('Failed to fetch role permissions:', err);
      showToast(err.message || 'Error loading role permissions from backend');
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [token, selectedRoleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // 3. Fetch live users assigned to active role
  const fetchRoleUsers = useCallback(async () => {
    if (!token || !selectedRoleId) return;
    setIsLoadingRoleUsers(true);
    try {
      const data = await apiRequest(`/api/roles/${selectedRoleId}/users?limit=10`, { token });
      const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
      const total = typeof data?.total === 'number' ? data.total : rows.length;
      setRoleUsers(rows);
      setRoleUsersTotal(total);
    } catch {
      // Non-critical fallback if user lacks permissions or endpoint unavailable
      setRoleUsers([]);
      setRoleUsersTotal(null);
    } finally {
      setIsLoadingRoleUsers(false);
    }
  }, [token, selectedRoleId]);

  useEffect(() => {
    fetchRoleUsers();
  }, [fetchRoleUsers]);

  const activeRole = useMemo(() => {
    return (
      roles.find((r) => String(r.id) === String(selectedRoleId)) ||
      roles[0] ||
      null
    );
  }, [roles, selectedRoleId]);

  // Determine hasChanges using Set difference
  const hasChanges = useMemo(() => {
    if (activePermissionIds.size !== baselinePermissionIds.size) return true;
    for (const id of activePermissionIds) {
      if (!baselinePermissionIds.has(id)) return true;
    }
    return false;
  }, [activePermissionIds, baselinePermissionIds]);

  // Toggle a permission by its integer ID
  const handleTogglePermissionId = useCallback(
    (permissionId) => {
      if (activeRole?.isLocked) {
        showToast('System Root roles cannot have permissions altered.');
        return;
      }

      setActivePermissionIds((prev) => {
        const next = new Set(prev);
        if (next.has(permissionId)) {
          next.delete(permissionId);
        } else {
          next.add(permissionId);
        }
        return next;
      });
    },
    [activeRole]
  );

  // Matrix view representation derived from live permissions
  const currentMatrix = useMemo(() => {
    const mat = {};
    for (const p of permissionsList) {
      const mod = (p.module || 'general').toLowerCase();
      if (!mat[mod]) {
        mat[mod] = { view: false, create: false, update: false, delete: false };
      }
      const isAssigned = activePermissionIds.has(p.permission_id);
      const pNameLower = p.name.toLowerCase();
      if (pNameLower.includes('view') || pNameLower.includes('list')) {
        if (isAssigned) mat[mod].view = true;
      } else if (pNameLower.includes('create') || pNameLower.includes('add')) {
        if (isAssigned) mat[mod].create = true;
      } else if (
        pNameLower.includes('update') ||
        pNameLower.includes('edit') ||
        pNameLower.includes('status')
      ) {
        if (isAssigned) mat[mod].update = true;
      } else if (
        pNameLower.includes('delete') ||
        pNameLower.includes('remove') ||
        pNameLower.includes('revoke')
      ) {
        if (isAssigned) mat[mod].delete = true;
      } else {
        if (isAssigned) mat[mod].view = true;
      }
    }
    return mat;
  }, [permissionsList, activePermissionIds]);

  // Compatibility handler for legacy module/action toggle
  const handleTogglePermission = (moduleId, action) => {
    if (activeRole?.isLocked) {
      showToast('System Root roles cannot have permissions altered.');
      return;
    }

    const matchingPerm = permissionsList.find((p) => {
      const mod = (p.module || '').toLowerCase();
      const pName = p.name.toLowerCase();
      const modMatch = mod === moduleId.toLowerCase() || pName.startsWith(moduleId.toLowerCase());
      if (!modMatch) return false;
      if (action === 'view') return pName.includes('view') || pName.includes('list');
      if (action === 'create') return pName.includes('create') || pName.includes('add');
      if (action === 'update') {
        return pName.includes('update') || pName.includes('edit') || pName.includes('status');
      }
      if (action === 'delete') return pName.includes('delete') || pName.includes('remove');
      return false;
    });

    if (matchingPerm) {
      handleTogglePermissionId(matchingPerm.permission_id);
    } else {
      showToast(`No corresponding backend permission found for ${moduleId}.${action}`);
    }
  };

  const handleSelectAllView = () => {
    if (activeRole?.isLocked) return;

    setActivePermissionIds((prev) => {
      const next = new Set(prev);
      permissionsList.forEach((p) => {
        const pNameLower = p.name.toLowerCase();
        if (pNameLower.includes('view') || pNameLower.includes('list')) {
          next.add(p.permission_id);
        }
      });
      return next;
    });

    showToast(`Enabled VIEW capability across accessible permissions for ${activeRole?.name || 'role'}.`);
  };

  const handleClearDeletes = () => {
    if (activeRole?.isLocked) return;

    setActivePermissionIds((prev) => {
      const next = new Set(prev);
      permissionsList.forEach((p) => {
        const pNameLower = p.name.toLowerCase();
        if (pNameLower.includes('delete') || pNameLower.includes('remove') || pNameLower.includes('revoke')) {
          next.delete(p.permission_id);
        }
      });
      return next;
    });

    showToast(`Revoked DELETE capability across all permissions for ${activeRole?.name || 'role'}.`);
  };

  const handleResetBaseline = () => {
    setActivePermissionIds(new Set(baselinePermissionIds));
    showToast(`Restored baseline access profile for "${activeRole?.name || 'role'}".`);
  };

  const handleDiscard = () => {
    setActivePermissionIds(new Set(baselinePermissionIds));
    showToast('Reset selections back to server baseline.');
  };

  const handleSave = async () => {
    if (!token || !selectedRoleId) return;
    if (activeRole?.isLocked) {
      showToast('System Root roles cannot have permissions altered.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        permission_ids: Array.from(activePermissionIds),
      };
      await apiRequest(`/api/roles/${selectedRoleId}/permissions/sync`, {
        token,
        method: 'POST',
        body: payload,
      });

      setBaselinePermissionIds(new Set(activePermissionIds));
      showToast(`Role permissions successfully synchronized for "${activeRole?.name || 'role'}".`);
      fetchPermissions();
    } catch (err) {
      console.error('Failed to sync role permissions:', err);
      showToast(err.message || 'Error saving role permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    const roleName = newRoleForm.name.trim();
    if (!roleName) return;

    setIsCreatingRole(true);
    try {
      const payload = {
        name: roleName,
        description: newRoleForm.description?.trim() || undefined,
      };

      const result = await apiRequest('/api/roles', {
        token,
        method: 'POST',
        body: payload,
      });

      const newRoleData = result?.data || result;
      const createdRoleId = newRoleData?.role_id || newRoleData?.id;

      showToast(`Role "${roleName}" successfully created.`);
      setIsModalOpen(false);
      setNewRoleForm({ name: '', tier: 'Specialist // L-2', description: '' });

      // Reload live roles list from backend and select new role
      await fetchRoles(createdRoleId);
      if (createdRoleId) {
        setSelectedRoleId(createdRoleId);
      }
    } catch (err) {
      console.error('Failed to create role:', err);
      showToast(err.message || 'Error creating role');
    } finally {
      setIsCreatingRole(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto select-none bg-surface text-on-surface pb-16 font-sans">
      <div className="flex flex-col w-full max-w-[1920px] mx-auto min-w-0 p-4 pt-3 gap-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-cyan-950 border border-cyan-400/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce font-mono text-xs">
            <span className="material-symbols-outlined text-cyan-400 text-base">verified_user</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Top Header Bar */}
        <RolesHeaderBar
          onDiscard={handleDiscard}
          onSave={handleSave}
          hasChanges={hasChanges}
          isSaving={isSaving}
          affectedUsersCount={activeRole?.usersCount ?? 0}
        />

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Roles Roster & Diagnostics */}
          <div className="xl:col-span-4 2xl:col-span-3">
            <RolesRosterList
              roles={roles}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
              onNewRole={() => setIsModalOpen(true)}
              assignedUsers={roleUsers}
              assignedUsersCount={roleUsersTotal}
              isLoadingUsers={isLoadingRoleUsers}
            />
          </div>

          {/* Right Column: Interactive Permissions Matrix */}
          <div className="xl:col-span-8 2xl:col-span-9">
            <RolesPermissionsMatrix
              role={activeRole}
              matrix={currentMatrix}
              permissionsList={permissionsList}
              activePermissionIds={activePermissionIds}
              isLoadingPermissions={isLoadingPermissions}
              onTogglePermissionId={handleTogglePermissionId}
              onTogglePermission={handleTogglePermission}
              onSelectAllView={handleSelectAllView}
              onClearDeletes={handleClearDeletes}
              onResetBaseline={handleResetBaseline}
            />
          </div>
        </div>

        {/* 3. New Role Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-lg">admin_panel_settings</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface m-0 font-mono">
                    Provision New Access Role
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateRole} className="p-5 flex flex-col gap-4 font-mono text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-outline font-semibold uppercase text-[11px]">Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hydrographic Specialist"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                    className="px-3 py-2 rounded bg-surface-container border border-outline-variant/60 focus:border-cyan-400 text-on-surface placeholder:text-outline text-xs outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-outline font-semibold uppercase text-[11px]">Security Tier</label>
                  <select
                    value={newRoleForm.tier}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, tier: e.target.value })}
                    className="px-3 py-2 rounded bg-surface-container border border-outline-variant/60 focus:border-cyan-400 text-on-surface text-xs outline-none cursor-pointer"
                  >
                    <option value="Operational // L-1">Operational // L-1</option>
                    <option value="Specialist // L-2">Specialist // L-2</option>
                    <option value="Senior Command // L-3">Senior Command // L-3</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-outline font-semibold uppercase text-[11px]">Scope &amp; Responsibilities</label>
                  <textarea
                    rows={3}
                    placeholder="Specify operational clearance remit and authority boundaries..."
                    value={newRoleForm.description}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                    className="px-3 py-2 rounded bg-surface-container border border-outline-variant/60 focus:border-cyan-400 text-on-surface placeholder:text-outline text-xs outline-none resize-none font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/30 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-outline text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRole}
                    className="px-4 py-1.5 rounded bg-cyan-400 text-black font-bold uppercase text-xs tracking-wider shadow-[0_0_12px_rgba(34,211,238,0.3)] hover:bg-cyan-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isCreatingRole && (
                      <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    )}
                    <span>{isCreatingRole ? 'Registering...' : 'Register Role'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
