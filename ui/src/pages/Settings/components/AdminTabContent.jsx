import { usePermissions } from '../../Permissions/hooks/usePermissions.js';
import { OperatorsList } from '../../Permissions/components/OperatorsList.jsx';
import { PermissionsList } from '../../Permissions/components/PermissionsList.jsx';

export function AdminTabContent({ token, canAdmin }) {
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

  if (!canAdmin) return null;

  return (
    <div>
      <h2 className="text-base font-extrabold text-white mb-4">Operator Permissions</h2>
      <p className="text-xs text-text-muted mb-4">Select an operator, then grant/revoke feature permissions</p>

      {adminUsersError ? (
        <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 mb-4">
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
  );
}
