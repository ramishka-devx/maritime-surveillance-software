import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';

const HOURLY_BUCKETS_COUNT = 24;

const DEFAULT_KPIS = {
  openAlerts: { value: 0, trend: 0 },
  criticalAlerts: { value: 0, trend: 0 },
  activeVessels: { value: 0, trend: 0 },
  anomalies: { value: 0, trend: 0 },
  incursions: { value: 0, trend: 0 },
};

function getTimeRangeBuckets(timeRange = '24h') {
  const normalized = String(timeRange || '24h').toLowerCase();
  const now = new Date();

  if (normalized === '7d') {
    const bucketCount = 7;
    return Array.from({ length: bucketCount }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (bucketCount - 1 - i));
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return {
        hour: d.toISOString(),
        startMs: d.getTime(),
        endMs: nextD.getTime(),
        label,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    });
  }

  if (normalized === '30d') {
    const bucketCount = 30;
    return Array.from({ length: bucketCount }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (bucketCount - 1 - i));
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return {
        hour: d.toISOString(),
        startMs: d.getTime(),
        endMs: nextD.getTime(),
        label,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    });
  }

  // Default: '24h'
  const bucketCount = 24;
  return Array.from({ length: bucketCount }, (_, i) => {
    const bucketStart = new Date(now);
    bucketStart.setHours(bucketStart.getHours() - (bucketCount - 1 - i));
    bucketStart.setMinutes(0, 0, 0);

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setHours(bucketEnd.getHours() + 1);

    return {
      hour: bucketStart.toISOString(),
      startMs: bucketStart.getTime(),
      endMs: bucketEnd.getTime(),
      label: bucketStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  });
}

function getCutoffTime(timeRange = '24h') {
  const normalized = String(timeRange || '24h').toLowerCase();
  const now = Date.now();
  if (normalized === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (normalized === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return new Date(now - 24 * 60 * 60 * 1000);
}

export function useDashboardData(timeRange = '24h', pollInterval = 30000) {
  const { token } = useAuth();
  const [rawData, setRawData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [alertsRes, vesselsRes, anomaliesRes, detectionsRes] = await Promise.allSettled([
        apiRequest('/api/alerts?limit=1000', { token }),
        apiRequest('/api/ais/positions/latest?limit=5000', { token }),
        apiRequest('/api/anomalies?limit=200', { token }),
        apiRequest('/api/restricted-areas/detections?limit=100', { token }),
      ]);

      setRawData({
        alerts: alertsRes.status === 'fulfilled' ? alertsRes.value : null,
        vessels: vesselsRes.status === 'fulfilled' ? vesselsRes.value : null,
        anomalies: anomaliesRes.status === 'fulfilled' ? anomaliesRes.value : null,
        detections: detectionsRes.status === 'fulfilled' ? detectionsRes.value : null,
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  const metrics = useMemo(() => {
    const buckets = getTimeRangeBuckets(timeRange);

    if (!rawData) {
      return {
        kpis: DEFAULT_KPIS,
        hourlyBuckets: buckets,
        incidentTypes: [],
        topFlaggedVessels: [],
        interdictionQueue: [],
        sectorDensity: [],
      };
    }

    const { alerts, vessels, anomalies, detections } = rawData;
    const cutoffTime = getCutoffTime(timeRange);
    const cutoffMs = cutoffTime.getTime();

    const allAlertRows = Array.isArray(alerts?.rows) ? alerts.rows : (Array.isArray(alerts) ? alerts : []);
    
    // Filter alerts to active time window
    const inRangeAlerts = allAlertRows.filter((a) => {
      if (!a.created_at) return true;
      const t = new Date(a.created_at).getTime();
      return t >= cutoffMs;
    });

    // Populate timeline buckets
    const hourlyBuckets = buckets.map((b) => ({ ...b }));
    for (const alert of inRangeAlerts) {
      const alertTimeMs = new Date(alert.created_at).getTime();
      const bucket = hourlyBuckets.find((b) => alertTimeMs >= b.startMs && alertTimeMs < b.endMs);
      if (bucket) {
        const sev = alert.severity?.toLowerCase();
        if (sev === 'critical') bucket.critical++;
        else if (sev === 'high') bucket.high++;
        else if (sev === 'medium') bucket.medium++;
        else bucket.low++;
      }
    }

    // Incident types in range
    const typeCounts = {};
    for (const alert of inRangeAlerts) {
      const type = alert.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    const totalAlertsInRange = inRangeAlerts.length;
    const incidentTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalAlertsInRange > 0 ? Math.round((count / totalAlertsInRange) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Top flagged vessels in range
    const vesselCounts = {};
    for (const alert of inRangeAlerts) {
      const key = alert.mmsi || alert.vessel_name || 'UNKNOWN';
      if (!vesselCounts[key]) {
        vesselCounts[key] = {
          mmsi: alert.mmsi,
          vesselName: alert.vessel_name || 'Unknown',
          count: 0,
        };
      }
      vesselCounts[key].count++;
    }
    const topFlaggedVessels = Object.values(vesselCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Live Interdiction Queue: open alerts in active range (fallback to all open alerts if 0)
    const openInRange = inRangeAlerts.filter((a) => a.status === 'open');
    const queueSource = openInRange.length > 0 ? openInRange : allAlertRows.filter((a) => a.status === 'open');
    const interdictionQueue = [...queueSource]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((a) => ({
        alertId: a.alert_id,
        title: a.title,
        severity: a.severity,
        type: a.type,
        vesselName: a.vessel_name || 'Unknown',
        mmsi: a.mmsi,
        createdAt: a.created_at,
      }));

    // Vessel & Sector density
    const vesselList = Array.isArray(vessels) ? vessels : (Array.isArray(vessels?.rows) ? vessels.rows : []);
    const activeVesselsCount = new Set(vesselList.map((v) => v.mmsi)).size;

    const sectorCounts = {
      'North-East': 0,
      'North-West': 0,
      'South-West': 0,
      'South-East': 0,
    };
    if (Array.isArray(vesselList)) {
      for (const v of vesselList) {
        if (typeof v.lat === 'number' && typeof v.lon === 'number') {
          if (v.lat >= 0 && v.lon >= 0) sectorCounts['North-East']++;
          else if (v.lat >= 0 && v.lon < 0) sectorCounts['North-West']++;
          else if (v.lat < 0 && v.lon < 0) sectorCounts['South-West']++;
          else sectorCounts['South-East']++;
        }
      }
    }
    const totalVessels = Object.values(sectorCounts).reduce((a, b) => a + b, 0);
    const sectorDensity = Object.entries(sectorCounts)
      .map(([sector, count]) => ({
        sector,
        count,
        percentage: totalVessels > 0 ? Math.round((count / totalVessels) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // KPIs
    const openAlertsCount = inRangeAlerts.filter((a) => a.status === 'open').length;
    const criticalCount = inRangeAlerts.filter((a) => a.severity === 'critical').length;
    const anomaliesCount = anomalies?.total ?? (Array.isArray(anomalies) ? anomalies.length : 0);
    const detectionList = Array.isArray(detections) ? detections : (Array.isArray(detections?.rows) ? detections.rows : []);
    const detectionsCount = detections?.total ?? detectionList.length;

    return {
      kpis: {
        openAlerts: {
          value: openAlertsCount,
          trend: openAlertsCount > 0 ? Math.round((criticalCount / openAlertsCount) * 100) : 0,
        },
        criticalAlerts: {
          value: criticalCount,
          trend: openAlertsCount > 0 ? Math.round((criticalCount / openAlertsCount) * 100) : 0,
        },
        activeVessels: { value: activeVesselsCount, trend: 0 },
        anomalies: { value: anomaliesCount, trend: 0 },
        incursions: { value: detectionsCount, trend: 0 },
      },
      hourlyBuckets,
      incidentTypes,
      topFlaggedVessels,
      interdictionQueue,
      sectorDensity,
    };
  }, [rawData, timeRange]);

  return { ...metrics, timeRange, isLoading, error };
}
