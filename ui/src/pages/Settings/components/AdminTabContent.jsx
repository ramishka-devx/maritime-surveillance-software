import { usePermissions } from '../../Permissions/hooks/usePermissions.js';
import { OperatorsList } from '../../Permissions/components/OperatorsList.jsx';
import { PermissionsList } from '../../Permissions/components/PermissionsList.jsx';

export function AdminTabContent({ token, canAdmin }) {
  const {
    operators,
    selectedOperator,
    selectedOperatorId,
    setSelectedOperatorId,
    adminUsersLoading,
    adminUsersError,
    operatorPermsLoading,
    operatorPermsError,
    permBusyId,
    operatorPermsByModule,
    togglePermission,
  } = usePermissions(token, canAdmin);

  if (!canAdmin) return null;

  return (
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
  );
}
