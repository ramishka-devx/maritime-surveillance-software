import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import { isMaintenance } from '../auth/roles.js';

export function useBadgeCounts(pollInterval = 10000) {
  const { token: authToken, user } = useAuth();
  const token = isMaintenance(user) ? null : authToken;
  const [counts, setCounts] = useState({
    alertCount: 0,
    restrictedAreaCount: 0,
  });

  const fetchCounts = useCallback(async () => {
    if (!token) return;

    // Open geofence alerts, not /restricted-areas/detections: that scans the position history.
    const [alertsRes, geofenceRes] = await Promise.allSettled([
      apiRequest('/api/alerts?status=open&limit=1', { token }),
      apiRequest('/api/alerts?status=open&type=geofence&limit=1', { token }),
    ]);

    const alertCount =
      alertsRes.status === 'fulfilled'
        ? alertsRes.value?.total ?? 0
        : 0;

    const restrictedAreaCount =
      geofenceRes.status === 'fulfilled'
        ? geofenceRes.value?.total ?? 0
        : 0;

    setCounts((prev) => {
      if (
        prev.alertCount === alertCount &&
        prev.restrictedAreaCount === restrictedAreaCount
      ) {
        return prev;
      }
      return { alertCount, restrictedAreaCount };
    });
  }, [token]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCounts, pollInterval]);

  return counts;
}
