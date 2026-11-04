import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import UsersHeaderBar from '../../components/users/UsersHeaderBar.jsx';
import UsersMetricsRow from '../../components/users/UsersMetricsRow.jsx';
import UsersFilterToolbar from '../../components/users/UsersFilterToolbar.jsx';
import UsersTable from '../../components/users/UsersTable.jsx';
import UsersDrawer from '../../components/users/UsersDrawer.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';
import { focusRing, pageShell } from '../../components/ui/bs.js';

const PAGE_SIZE = 50;

function normalizeUser(u) {
  const raw = String(u.status || '').toLowerCase();
  const status = raw === 'disabled' || raw === 'deactivated' ? 'DEACTIVATED' : raw === 'pending' ? 'PENDING' : 'ACTIVE';
  return {
    ...u,
    id: u.user_id ?? u.id,
    name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `User #${u.user_id}`,
    email: u.email || '—',
    username: u.username || '',
    role: u.role || 'operator',
    status,
  };
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [notice, setNotice] = useState(null);

  const showNotice = (text, isError = false) => {
    setNotice({ text, isError });
    setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 4000);
  };

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await apiRequest(`/api/users?page=${currentPage}&limit=${PAGE_SIZE}`, { token });
      const rows = Array.isArray(res) ? res : res?.rows || [];
      setUsers(rows.map(normalizeUser));
      setTotalRecords(typeof res?.total === 'number' ? res.total : rows.length);
    } catch (err) {
      showNotice(err.message || 'Could not load users.', true);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Throws on failure so the dialog can show the error and stay open.
  const handleCreateUser = async (body) => {
    await apiRequest('/api/users/register', { token, method: 'POST', body });
    showNotice(`${body.first_name} ${body.last_name} added as an operator.`);
    await loadUsers();
  };

  const handleToggleDeactivate = async (user) => {
    const next = user.status === 'ACTIVE' ? 'disabled' : 'verified';
    setBusyUserId(user.id);
    try {
      await apiRequest(`/api/users/${user.id}/status`, { token, method: 'PUT', body: { status: next } });
      showNotice(`${user.name} ${next === 'verified' ? 'reactivated' : 'deactivated'}.`);
      await loadUsers();
    } catch (err) {
      showNotice(err.message || 'Could not change the user status.', true);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleExport = () => {
    const lines = [['Name', 'Username', 'Email', 'Role', 'Status', 'Updated', 'Created']]
      .concat(users.map((u) => [u.name, u.username, u.email, u.role, u.status, u.updated_at, u.created_at]))
      .map((row) => row.map(csvCell).join(','));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'serenguard_users.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const roles = useMemo(() => [...new Set(users.map((u) => u.role))].sort(), [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!q || [u.name, u.email, u.username, u.role].some((v) => String(v).toLowerCase().includes(q))) &&
        (roleFilter === 'all' || u.role === roleFilter) &&
        (statusFilter === 'all' || u.status === statusFilter.toUpperCase())
    );
  }, [users, searchQuery, roleFilter, statusFilter]);

  const count = (s) => users.filter((u) => u.status === s).length;
  const total = totalRecords || users.length;

  return (
    <div className={pageShell} aria-busy={isLoading}>
      <UsersHeaderBar
        totalUsers={total}
        activeUsers={count('ACTIVE')}
        isLoading={isLoading}
        onExport={handleExport}
        onOpenCreateDrawer={() => setIsDrawerOpen(true)}
      />

      <UsersMetricsRow
        totalCount={total}
        activeCount={count('ACTIVE')}
        deactivatedCount={count('DEACTIVATED')}
        pendingCount={count('PENDING')}
      />

      <UsersFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roles={roles}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => {
          setSearchQuery('');
          setRoleFilter('all');
          setStatusFilter('all');
        }}
        showingCount={filteredUsers.length}
        totalCount={total}
      />

      <UsersTable
        users={filteredUsers}
        isLoading={isLoading}
        onToggleDeactivate={handleToggleDeactivate}
        busyUserId={busyUserId}
        currentPage={currentPage}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        onPageChange={setCurrentPage}
      />

      {isDrawerOpen && <UsersDrawer onClose={() => setIsDrawerOpen(false)} onCreateUser={handleCreateUser} />}

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
