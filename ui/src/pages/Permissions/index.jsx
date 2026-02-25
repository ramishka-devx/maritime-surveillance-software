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
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111b2e]">
      <div className="bg-gradient-to-r from-[#0b1220] to-[#111b2e] p-8 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-white mb-2">Permissions</h1>
        <p className="text-gray-400">Grant and revoke operator feature access</p>
      </div>

      <div className="p-8">
        <div className="bg-[#1a2942] border border-gray-700 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Operator Permissions</h3>
            <p className="text-gray-400 text-sm">
              Select an operator, then grant/revoke feature permissions (for example:{' '}
              <span className="text-white font-semibold">ais.view</span>).
            </p>
          </div>

          {adminUsersError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {adminUsersError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
