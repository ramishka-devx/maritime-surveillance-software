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
    markOperatorPermissionAssignedByName,
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
    <div className="flex flex-col h-full bg-[#f1f5f9]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex h-[calc(100vh-120px)]">
        
        {/* Left Sidebar for Operators */}
        <div className="w-80 border-r border-gray-100 bg-gray-50/30 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-extrabold text-[#1b397e]">Permissions</h1>
            <p className="text-xs font-semibold text-gray-500 mt-1">Grant and revoke feature access</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <OperatorsList
              operators={operators}
              selectedOperatorId={selectedOperatorId}
              onSelectOperator={setSelectedOperatorId}
              isLoading={adminUsersLoading}
            />
          </div>
        </div>

        {/* Right Content Area for Permissions */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="max-w-4xl">
            {adminUsersError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-600">
                {adminUsersError}
              </div>
            ) : null}

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

        <OperatorActivityModal
          isOpen={activityOpen}
          operator={selectedOperator}
          activities={activities}
          loading={activityLoading}
          error={activityError}
          onClose={closeActivity}
          token={token}
          onPermissionGranted={markOperatorPermissionAssignedByName}
        />
      </div>
    </div>
  );
}
