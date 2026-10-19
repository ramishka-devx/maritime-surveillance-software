import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import { isMaintenance } from '../auth/roles.js';

export function useBadgeCounts(pollInterval = 10000) {
  const { token: authToken, user } = useAuth();
  const token = isMaintenance(user) ? null : authToken;
  const [counts, setCounts] = useState({
    alertCount: 0,
    anomalyCount: 0,
    restrictedAreaCount: 0,
  });

  const fetchCounts = useCallback(async () => {
    if (!token) return;

    const [alertsRes, anomaliesRes, detectionsRes] = await Promise.allSettled([
      apiRequest('/api/alerts?status=open&limit=1', { token }),
      apiRequest('/api/anomalies?limit=1', { token }),
      apiRequest('/api/restricted-areas/detections?limit=1', { token }),
    ]);

    const alertCount =
      alertsRes.status === 'fulfilled'
        ? alertsRes.value?.total ?? 0
        : 0;

    const anomalyCount =
      anomaliesRes.status === 'fulfilled'
        ? anomaliesRes.value?.total ?? 0
        : 0;

    const restrictedAreaCount =
      detectionsRes.status === 'fulfilled'
        ? Array.isArray(detectionsRes.value)
          ? detectionsRes.value.length
          : 0
        : 0;

    setCounts((prev) => {
      if (
        prev.alertCount === alertCount &&
        prev.anomalyCount === anomalyCount &&
        prev.restrictedAreaCount === restrictedAreaCount
      ) {
        return prev;
      }
      return { alertCount, anomalyCount, restrictedAreaCount };
    });
  }, [token]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCounts, pollInterval]);

  return counts;
}
