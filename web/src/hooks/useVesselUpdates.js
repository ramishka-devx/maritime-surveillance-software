import { useState, useEffect, useRef } from 'react';
import { getLatestVesselPositions } from '../lib/vessels';

/**
 * Custom hook for real-time vessel data updates
 * Implements polling with change detection to avoid unnecessary re-renders
 * 
 * Features:
 * - Configurable polling interval
 * - Automatic retry on failure
 * - Change detection (only returns updated vessels)
 * - Error handling with fallback
 */
export function useVesselUpdates(token, pollInterval = 5000) {
  const [vessels, setVessels] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const lastFetchTimeRef = useRef(0);
  const lastDataRef = useRef(null);
  const isFirstFetchRef = useRef(true);
  const abortControllerRef = useRef(null);

  const fetchVessels = async () => {
    // Debounce fetches to prevent concurrent requests
    const now = Date.now();
    if (now - lastFetchTimeRef.current < pollInterval - 500) {
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      setIsUpdating(true);
      abortControllerRef.current = new AbortController();

      const data = await getLatestVesselPositions(token, 1000);

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }

      // Transform data
      const transformedData = data.map((v) => ({
        ...v,
        id: v.mmsi,
      }));

      // For first fetch, return all data
      if (isFirstFetchRef.current) {
        setVessels(transformedData);
        lastDataRef.current = transformedData;
        isFirstFetchRef.current = false;
        setError(null);
        return;
      }

      // For subsequent fetches, only update if data changed
      if (hasDataChanged(lastDataRef.current, transformedData)) {
        setVessels(transformedData);
        lastDataRef.current = transformedData;
      }

      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch vessels:', err);
        setError(err.message || 'Failed to fetch vessel data');
        
        // Keep showing last successful data on error
        if (!lastDataRef.current) {
          setVessels([]);
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Setup polling
  useEffect(() => {
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    // Initial fetch
    fetchVessels();

    // Setup interval
    const interval = setInterval(fetchVessels, pollInterval);

    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [token, pollInterval]);

  return {
    vessels,
    isUpdating,
    error,
  };
}

/**
 * Check if vessel data has changed
 * Shallow comparison to avoid unnecessary updates
 */
function hasDataChanged(oldData, newData) {
  if (!oldData || oldData.length !== newData.length) {
    return true;
  }

  // Create map of MMSI to vessel for quick comparison
  const oldMap = new Map(oldData.map((v) => [v.mmsi, v]));

  for (const newVessel of newData) {
    const oldVessel = oldMap.get(newVessel.mmsi);
    if (!oldVessel) {
      return true; // New vessel
    }

    // Check key properties for changes
    if (
      oldVessel.lat !== newVessel.lat ||
      oldVessel.lon !== newVessel.lon ||
      oldVessel.sog !== newVessel.sog ||
      oldVessel.cog !== newVessel.cog ||
      oldVessel.heading !== newVessel.heading ||
      oldVessel.nav_status !== newVessel.nav_status
    ) {
      return true;
    }
  }

  return false;
}
