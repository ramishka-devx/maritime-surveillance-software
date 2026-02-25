import { useEffect, useMemo, useRef, useState } from "react";

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export function useAlerts(enableSimulation = true) {
  const [alerts, setAlerts] = useState(() => [
    {
      id: "a1",
      title: "AIS Spoofing Detected",
      level: "critical",
      status: "Resolved",
      when: "2024-01-15 14:23:47",
      vessel: "MV OrionSkies",
      mmsi: "563829104",
      description: "Vessel transmitting false position data",
      notes: "Vessel identified and tracked. Local authorities notified.",
      resolvedBy: "Operator 1",
      assignedTo: "Operator 1",
      acknowledged: true,
      unread: false,
    },
    {
      id: "a2",
      title: "Loitering Behavior",
      level: "warning",
      status: "Active",
      when: "2024-01-15 13:45:12",
      vessel: "SS Pacific Dawn",
      mmsi: "441208773",
      description: "Vessel stationary for extended period",
      notes: "Possible rendezvous. Monitoring for route deviation.",
      resolvedBy: "—",
      assignedTo: "—",
      acknowledged: false,
      unread: true,
    },
    {
      id: "a3",
      title: "Restricted Zone Violation",
      level: "critical",
      status: "Investigating",
      when: "2024-01-15 12:10:22",
      vessel: "Unknown Vessel",
      mmsi: "—",
      description: "Unauthorized entry into protected area",
      notes: "Coast guard dispatched to intercept.",
      resolvedBy: "—",
      assignedTo: "Operator 1",
      acknowledged: false,
      unread: true,
    },
    {
      id: "a4",
      title: "Dark Vessel Detected",
      level: "warning",
      status: "Resolved",
      when: "2024-01-15 11:05:33",
      vessel: "N/A",
      mmsi: "—",
      description: "Vessel detected without AIS transmission",
      notes: "Fishing vessel with malfunctioning AIS transponder.",
      resolvedBy: "Operator 2",
      assignedTo: "Operator 2",
      acknowledged: true,
      unread: false,
    },
    {
      id: "a5",
      title: "Speed Anomaly",
      level: "info",
      status: "Resolved",
      when: "2024-01-15 09:48:18",
      vessel: "HMS Guardian",
      mmsi: "271998120",
      description: "Unusual speed pattern detected",
      notes: "Routine patrol operations confirmed.",
      resolvedBy: "Operator 2",
      assignedTo: "Operator 3",
      acknowledged: true,
      unread: false,
    },
  ]);

  const simCounterRef = useRef(100);

  useEffect(() => {
    if (!enableSimulation) return;

    const candidates = [
      {
        title: "AIS Dropout",
        level: "warning",
        status: "Active",
        vessel: "TS Meridian",
        mmsi: "566210772",
        description: "AIS signal lost for 6 minutes",
        notes: "Attempt radar correlation and identify track.",
      },
      {
        title: "Geofence Proximity",
        level: "info",
        status: "Active",
        vessel: "MV Seabird",
        mmsi: "412009331",
        description: "Approaching Zone A-2 boundary",
        notes: "Monitor for entry; notify if crossing threshold.",
      },
      {
        title: "Restricted Zone Entry",
        level: "critical",
        status: "Active",
        vessel: "Unknown Vessel",
        mmsi: "—",
        description: "Entered Zone C-1",
        notes: "Immediate response recommended. Verify via sensors.",
      },
    ];

    const t = setInterval(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      simCounterRef.current += 1;

      const newAlert = {
        id: `a${simCounterRef.current}`,
        ...pick,
        when: "Just now",
        resolvedBy: "—",
        assignedTo: "—",
        acknowledged: false,
        unread: true,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
    }, 12000);

    return () => clearInterval(t);
  }, [enableSimulation]);

  const unreadCount = useMemo(
    () => alerts.reduce((acc, a) => acc + (a.unread ? 1 : 0), 0),
    [alerts]
  );

  const markRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unread: false } : a))
    );
  };

  const acknowledge = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged: true, unread: false } : a
      )
    );
  };

  const resolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Resolved",
              acknowledged: true,
              unread: false,
              resolvedBy: a.resolvedBy === "—" ? "Operator 1" : a.resolvedBy,
            }
          : a
      )
    );
  };

  const assignTo = (id, name) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignedTo: name, unread: false } : a))
    );
  };

  return {
    alerts,
    unreadCount,
    markRead,
    acknowledge,
    resolve,
    assignTo,
    normalize,
  };
}
