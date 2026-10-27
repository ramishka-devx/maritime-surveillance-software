import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';

// GET /api/dashboard/summary: every dashboard figure, aggregated server-side (cached ~60 s).
export function useDashboardData(timeRange = '24h', sectorId = null, pollInterval = 30000) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    // A slow answer for a previous range/sector must not overwrite the current one.
    let stale = false;
    const url = `/api/dashboard/summary?range=${timeRange}${sectorId ? `&sector_id=${sectorId}` : ''}`;
    const load = () =>
      apiRequest(url, { token })
        .then((d) => {
          if (stale) return;
          setData(d);
          setError(null);
        })
        .catch((err) => {
          if (!stale) setError(err.message || 'Failed to fetch dashboard data');
        });
    load();
    const interval = setInterval(load, pollInterval);
    return () => {
      stale = true;
      clearInterval(interval);
    };
  }, [token, timeRange, sectorId, pollInterval]);

  return { data, error };
}
