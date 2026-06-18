import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext.jsx";

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export function useAlerts() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/alerts?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      
      // Map API response to UI expected format
      const mapped = data.data.rows.map(a => ({
        id: a.alert_id,
        title: a.title,
        level: a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'warning' : 'info',
        severity: a.severity.charAt(0).toUpperCase() + a.severity.slice(1),
        status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
        when: new Date(a.created_at).toLocaleString(),
        vessel: a.vessel_name || "Unknown Vessel",
        mmsi: a.mmsi || "—",
        description: a.description || "",
        notes: null,
        resolvedBy: "—",
        assignedTo: a.assigned_to ? `User ${a.assigned_to}` : "—",
        acknowledged: a.status === 'acknowledged' || a.status === 'resolved',
        unread: a.status === 'open',
      }));

      setAlerts(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = useMemo(
    () => alerts.reduce((acc, a) => acc + (a.unread ? 1 : 0), 0),
    [alerts]
  );

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = (id) => {
    // Only local update to dismiss the "new" badge
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unread: false } : a))
    );
  };

  const acknowledge = (id) => updateStatus(id, 'acknowledged');
  const resolve = (id) => updateStatus(id, 'resolved');

  const assignTo = async (id, name) => {
    // We assume name here is a user ID or just local state for now
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assigned_to: parseInt(name, 10) || null })
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    alerts,
    unreadCount,
    loading,
    markRead,
    acknowledge,
    resolve,
    assignTo,
    normalize,
  };
}
