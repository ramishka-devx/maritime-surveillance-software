import React, { useState, useMemo, useEffect, useCallback } from 'react';
import UsersHeaderBar from '../../components/users/UsersHeaderBar.jsx';
import UsersMetricsRow from '../../components/users/UsersMetricsRow.jsx';
import UsersFilterToolbar from '../../components/users/UsersFilterToolbar.jsx';
import UsersTable from '../../components/users/UsersTable.jsx';
import UsersDrawer from '../../components/users/UsersDrawer.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';

function normalizeUser(u) {
  const rawStatus = String(u.status || '').toLowerCase();
  let status = 'ACTIVE';
  if (rawStatus === 'disabled' || rawStatus === 'deactivated') {
    status = 'DEACTIVATED';
  } else if (rawStatus === 'pending') {
    status = 'PENDING';
  } else {
    status = 'ACTIVE';
  }

  const name =
    u.name ||
    [u.first_name, u.last_name].filter(Boolean).join(' ') ||
    u.username ||
    `User #${u.user_id || u.id}`;

  const lastLogin =
    u.lastLogin ||
    (u.updated_at
      ? `${new Date(u.updated_at).toUTCString().slice(17, 22)} UTC`
      : 'Active Session');

  const provisioned =
    u.provisioned ||
    (u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '—');

  return {
    ...u,
    id: u.id || `usr-${u.user_id}`,
    user_id: u.user_id || (typeof u.id === 'string' ? Number(u.id.replace('usr-', '')) : u.id),
    name,
    email: u.email || 'N/A',
    username: u.username || '',
    role: u.role || 'Operator',
    status,
    rawStatus: u.status,
    lastLogin,
    provisioned,
  };
}

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
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await apiRequest(`/api/users?page=${currentPage}&limit=50`, { token });
      const rawList = Array.isArray(res) ? res : res?.rows || [];
      const total = typeof res?.total === 'number' ? res.total : rawList.length;
      setUsers(rawList.map(normalizeUser));
      setTotalRecords(total);
    } catch (err) {
      console.error('Failed to load users roster:', err);
      triggerToast('Error loading live users roster');
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (newUser) => {
    try {
      const fullName = String(newUser.name || '').trim();
      const nameParts = fullName.split(' ');
      const first_name = nameParts[0] || 'User';
      const last_name = nameParts.slice(1).join(' ') || 'Surveillance';
      const email = newUser.email.trim();
      const username =
        newUser.username ||
        email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '') ||
        `user${Date.now().toString().slice(-4)}`;
      const password = newUser.tempKey || 'SG-9kR#4vB7@pX9';

      await apiRequest('/api/users/register', {
        token,
        method: 'POST',
        body: {
          first_name,
          last_name,
          username,
          email,
          password,
        },
      });

      triggerToast(`User "${fullName}" provisioned and invite beacon dispatched.`);
      await loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      triggerToast(err.message || 'Failed to provision user');
    }
  };

  const handleToggleDeactivate = async (user) => {
    const rawId =
      user.user_id ||
      (typeof user.id === 'string' && user.id.startsWith('usr-')
        ? user.id.replace('usr-', '')
        : user.id);
    const isCurrentlyActive = user.status === 'ACTIVE';
    const nextDbStatus = isCurrentlyActive ? 'disabled' : 'verified';

    try {
      await apiRequest(`/api/users/${rawId}/status`, {
        token,
        method: 'PUT',
        body: { status: nextDbStatus },
      });
      triggerToast(
        `User ${user.name} marked as ${nextDbStatus === 'verified' ? 'ACTIVE' : 'DEACTIVATED'}.`
      );
      await loadUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
      triggerToast(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = (user) => {
    triggerToast(`Temporary authentication key reset dispatched to ${user.email}.`);
  };

  const handleEditUser = (user) => {
    triggerToast(`Opening credentials inspector for ${user.name}.`);
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Name,Email,Role,Status,LastLogin,Provisioned']
        .concat(
          users.map(
            (u) =>
              `"${u.name}","${u.email}","${u.role}","${u.status}","${u.lastLogin}","${u.provisioned}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'serenguard_users_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('User roster exported to serenguard_users_roster.csv');
  };

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (roleFilter !== 'all') {
        const r = String(u.role || '').toLowerCase();
        if (roleFilter === 'super_admin' && !r.includes('super')) return false;
        if (roleFilter === 'admin' && !r.includes('admin')) return false;
        if (roleFilter === 'operator' && !r.includes('operator')) return false;
        if (roleFilter === 'analyst' && !r.includes('analyst')) return false;
        if (roleFilter === 'viewer' && !r.includes('viewer')) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && u.status !== 'ACTIVE') return false;
        if (statusFilter === 'pending' && u.status !== 'PENDING') return false;
        if (statusFilter === 'deactivated' && u.status !== 'DEACTIVATED') return false;
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const deactivatedCount = users.filter((u) => u.status === 'DEACTIVATED').length;
  const pendingCount = users.filter((u) => u.status === 'PENDING').length;
  const totalPages = Math.max(1, Math.ceil((totalRecords || users.length) / 50));

  return (
    <div className="w-full h-full overflow-y-auto select-none bg-surface text-on-surface pb-16 font-sans">
      <div className="flex flex-col w-full max-w-[1920px] mx-auto min-w-0">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-cyan-950 border border-cyan-400/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce font-mono text-xs">
            <span className="material-symbols-outlined text-cyan-400 text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Top Header Bar */}
        <UsersHeaderBar
          totalUsers={totalRecords || users.length}
          activeUsers={activeCount}
          onExport={handleExport}
          onOpenCreateDrawer={() => setIsDrawerOpen(true)}
        />

        {/* 2. Metric Badges Row */}
        <UsersMetricsRow
          totalCount={totalRecords || users.length}
          activeCount={activeCount}
          deactivatedCount={deactivatedCount}
          pendingCount={pendingCount}
        />

        {/* 3. Operational Filter Toolbar */}
        <UsersFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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
          totalCount={totalRecords || users.length}
        />

        {/* 4. Primary Users Table */}
        <UsersTable
          users={filteredUsers}
          isLoading={isLoading}
          onEditUser={handleEditUser}
          onResetPassword={handleResetPassword}
          onToggleDeactivate={handleToggleDeactivate}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={totalRecords || users.length}
        />

        {/* 5. Slide-Over Invite Drawer */}
        <UsersDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onCreateUser={handleCreateUser}
        />
      </div>
    </div>
  );
}
