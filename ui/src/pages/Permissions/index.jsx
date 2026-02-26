import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { usePermissions } from './hooks/usePermissions.js';
import { OperatorsList } from './components/OperatorsList.jsx';
import { PermissionsList } from './components/PermissionsList.jsx';
import { OperatorActivityModal } from './components/OperatorActivityModal.jsx';
import { apiRequest } from '../../lib/api.js';

export default function Permissions() {
  const { token, isSuperAdmin } = useAuth();
  const canAdmin = isSuperAdmin();

  const [activityOpen, setActivityOpen] = React.useState(false);
  const [activities, setActivities] = React.useState([]);
  const [activityLoading, setActivityLoading] = React.useState(false);
  const [activityError, setActivityError] = React.useState('');

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

  const openActivity = React.useCallback(() => {
    if (!selectedOperatorId) return;
    setActivityOpen(true);
  }, [selectedOperatorId]);

  const closeActivity = React.useCallback(() => {
    setActivityOpen(false);
  }, []);

  React.useEffect(() => {
    if (!activityOpen) return;
    if (!token) return;
    if (!selectedOperatorId) return;

    let cancelled = false;
    setActivityLoading(true);
    setActivityError('');
    setActivities([]);

    (async () => {
      try {
        const data = await apiRequest(
          `/api/activities?page=1&limit=50&user_id=${encodeURIComponent(String(selectedOperatorId))}`,
          { token },
        );

        const rows = Array.isArray(data?.data) ? data.data : [];
        if (!cancelled) setActivities(rows);
      } catch (e) {
        if (!cancelled) setActivityError(e?.message || 'Failed to load activity');
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activityOpen, selectedOperatorId, token]);

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
              <span className="text-white font-semibold">dashboard.view</span>).
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
              onViewActivity={openActivity}
            />
          </div>
        </div>
      </div>

      <OperatorActivityModal
        isOpen={activityOpen}
        operator={selectedOperator}
        activities={activities}
        loading={activityLoading}
        error={activityError}
        onClose={closeActivity}
      />
    </div>
  );
}
