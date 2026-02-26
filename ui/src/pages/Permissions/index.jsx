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
              <span className="text-white font-semibold">dashboard.view</span>).
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
