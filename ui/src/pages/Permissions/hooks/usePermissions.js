import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../../lib/api.js';

export function usePermissions(token, canAdmin) {
  const [adminUsers, setAdminUsers] = useState(null);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');

  const [operatorPermissions, setOperatorPermissions] = useState(null);
  const [operatorPermsLoading, setOperatorPermsLoading] = useState(false);
  const [operatorPermsError, setOperatorPermsError] = useState('');
  const [permBusyId, setPermBusyId] = useState(null);

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
  }, [adminUsers, adminUsersLoading, canAdmin, token]);

  useEffect(() => {
    if (!canAdmin) return;
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
  }, [canAdmin, selectedOperatorId, token]);

  const operatorPermsByModule = useMemo(() => {
    const rows = Array.isArray(operatorPermissions) ? operatorPermissions : [];
    const grouped = {};
    for (const p of rows) {
      const module = p.module || 'other';
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(p);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, perms]) => ({
        module,
        perms: perms.sort((x, y) => String(x.name || '').localeCompare(String(y.name || ''))),
      }));
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
          Number(p.permission_id) === permId ? { ...p, assigned: currentlyAssigned ? 0 : 1 } : p,
        );
      });
    } catch (e) {
      setOperatorPermsError(e?.message || 'Failed to update permission');
    } finally {
      setPermBusyId(null);
    }
  }

  return {
    operators,
    selectedOperator,
    selectedOperatorId,
    setSelectedOperatorId,
    adminUsers,
    adminUsersLoading,
    adminUsersError,
    operatorPermissions,
    operatorPermsLoading,
    operatorPermsError,
    permBusyId,
    operatorPermsByModule,
    togglePermission,
  };
}
