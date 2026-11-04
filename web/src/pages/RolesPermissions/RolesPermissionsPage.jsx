import React, { useState, useMemo, useEffect, useCallback } from 'react';
import RolesHeaderBar from '../../components/roles/RolesHeaderBar.jsx';
import RolesRosterList from '../../components/roles/RolesRosterList.jsx';
import RolesPermissionsMatrix from '../../components/roles/RolesPermissionsMatrix.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';
import { btn, btnNeutral, btnPrimary, field, focusRing, label, pageShell } from '../../components/ui/bs.js';
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

  // New Role Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '' });
  const [createError, setCreateError] = useState(null);

  // Status notice at the bottom of the page.
  const [notice, setNotice] = useState(null);

  const showToast = (text, isError = false) => {
    setNotice({ text, isError });
    setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 4000);
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

        const normalized = roleList
          .filter(role => String(role.name || '').trim().toLowerCase() !== 'maintenance')
          .map(normalizeRole);
        setRoles(normalized);
        if (normalized.length > 0) {
          setSelectedRoleId((prev) => {
            const target = preferredRoleId || prev;
            const exists = normalized.some((r) => String(r.id) === String(target));
            return exists ? target : normalized[0].id;
          });
        } else {
          setSelectedRoleId(null);
        }
      } catch (err) {
        console.error('Failed to fetch live roles:', err);
        showToast(err.message || 'Could not load roles.', true);
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
      showToast(err.message || 'Could not load permissions.', true);
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [token, selectedRoleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

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
        showToast('Super admin permissions can’t be changed.', true);
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

  const handleDiscard = () => {
    setActivePermissionIds(new Set(baselinePermissionIds));
  };

  const handleSave = async () => {
    if (!token || !selectedRoleId) return;
    if (activeRole?.isLocked) {
      showToast('Super admin permissions can’t be changed.', true);
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
      showToast(`Permissions saved for ${activeRole?.name || 'the role'}.`);
      fetchPermissions();
    } catch (err) {
      console.error('Failed to sync role permissions:', err);
      showToast(err.message || 'Could not save the permissions.', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    const roleName = newRoleForm.name.trim();
    if (!roleName) return;

    setIsCreatingRole(true);
    setCreateError(null);
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

      showToast(`Role ${roleName} created.`);
      setIsModalOpen(false);
      setNewRoleForm({ name: '', description: '' });

      // Reload live roles list from backend and select new role
      await fetchRoles(createdRoleId);
      if (createdRoleId) {
        setSelectedRoleId(createdRoleId);
      }
    } catch (err) {
      setCreateError(err.message || 'Could not create the role.');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCreateError(null);
  };
  return (
    <div className={pageShell}>
      <RolesHeaderBar onDiscard={handleDiscard} onSave={handleSave} hasChanges={hasChanges} isSaving={isSaving} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-x-12 gap-y-8 items-start">
        <RolesRosterList
          roles={roles}
          isLoading={isLoadingRoles}
          selectedRoleId={selectedRoleId}
          onSelectRole={setSelectedRoleId}
          onNewRole={() => setIsModalOpen(true)}
        />
        <RolesPermissionsMatrix
          role={activeRole}
          permissionsList={permissionsList}
          activePermissionIds={activePermissionIds}
          isLoadingPermissions={isLoadingPermissions}
          onTogglePermissionId={handleTogglePermissionId}
        />
      </div>

      {isModalOpen && (
        <Modal
          title="New role"
          subtitle="Starts with no permissions."
          onClose={closeModal}
          busy={isCreatingRole}
          footer={
            <>
              {createError && (
                <span role="alert" className="text-[13px] italic text-bs-accent-2-700 mr-auto">
                  {createError}
                </span>
              )}
              <button type="button" onClick={closeModal} disabled={isCreatingRole} className={`${btn} ${btnNeutral} ml-auto`}>
                Cancel
              </button>
              <button
                type="submit"
                form="new-role-form"
                disabled={isCreatingRole || newRoleForm.name.trim().length < 2}
                className={`${btn} ${btnPrimary}`}
              >
                {isCreatingRole ? 'Creating…' : 'Create role'}
              </button>
            </>
          }
        >
          <form id="new-role-form" onSubmit={handleCreateRole} className="flex flex-col gap-4">
            <div>
              <label htmlFor="role-name" className={label}>Name</label>
              <input
                id="role-name"
                autoFocus
                required
                minLength={2}
                maxLength={50}
                placeholder="e.g. analyst"
                value={newRoleForm.name}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="role-description" className={label}>Description</label>
              <textarea
                id="role-description"
                rows={3}
                placeholder="What this role is for"
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                className={`${field} h-auto py-2 resize-none`}
              />
            </div>
          </form>
        </Modal>
      )}

      {notice && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[900] max-w-[80%] px-4 py-2.5 bg-bs-bg shadow-bs-lg text-[13px] flex items-center gap-3">
          <span className={notice.isError ? 'italic text-bs-accent-2-700' : 'italic'}>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className={`text-bs-neutral-700 ${focusRing}`}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
