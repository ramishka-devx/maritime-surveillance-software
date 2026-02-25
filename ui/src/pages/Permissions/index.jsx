import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { usePermissions } from './hooks/usePermissions.js';
import { OperatorsList } from './components/OperatorsList.jsx';
import { PermissionsList } from './components/PermissionsList.jsx';

export default function Permissions() {
  const { token, isSuperAdmin } = useAuth();
  const canAdmin = isSuperAdmin();

  const {
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
  } = usePermissions(token, canAdmin);

  if (!canAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-nav-bg to-nav-bg-soft px-6 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-accent-orange">Permissions</h1>
          <p className="text-xs font-semibold text-text-muted">Grant and revoke operator feature access</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="mb-4">
            <h3 className="text-md font-extrabold text-white">Operator Permissions</h3>
            <p className="mt-1 text-sm font-semibold text-text-muted">
              Select an operator, then grant/revoke feature permissions (for example:{' '}
              <span className="text-white/80 font-extrabold">ais.view</span>).
            </p>
          </div>

          {adminUsersError ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] text-red-200">
              {adminUsersError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OperatorsList
              operators={operators}
              selectedOperatorId={selectedOperatorId}
              onSelectOperator={setSelectedOperatorId}
              isLoading={adminUsersLoading}
            />

            <PermissionsList
              selectedOperator={selectedOperator}
              operatorPermsByModule={operatorPermsByModule}
              isLoading={operatorPermsLoading}
              permBusyId={permBusyId}
              error={operatorPermsError}
              onTogglePermission={togglePermission}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
