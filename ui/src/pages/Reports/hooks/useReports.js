import { useMemo } from 'react';

export function useReports() {
  const recentReports = useMemo(
    () => [
      { id: 1, title: "Daily Surveillance Summary", date: "2024-01-15", type: "Summary", stats: "12 alerts • 156 vessels" },
      { id: 2, title: "Anomaly Detection Report", date: "2024-01-15", type: "Anomaly", stats: "8 alerts • 9 vessels" },
      { id: 3, title: "AIS Spoofing Incidents", date: "2024-01-14", type: "Security", stats: "3 alerts • 3 vessels" },
      { id: 4, title: "Restricted Zone Violations", date: "2024-01-14", type: "Violation", stats: "5 alerts • 5 vessels" },
      { id: 5, title: "Weekly Activity Analysis", date: "2024-01-12", type: "Analysis", stats: "45 alerts • 892 vessels" },
    ],
    []
  );

  const getFilteredReports = (reports, query, typeFilter, sortBy) => {
    const q = query.trim().toLowerCase();

    let arr = reports.filter((r) => {
      const qOk = q.length === 0 ? true : `${r.title} ${r.type}`.toLowerCase().includes(q);
      const tOk = typeFilter === "All" ? true : r.type === typeFilter;
      return qOk && tOk;
    });

    arr.sort((a, b) => {
      if (sortBy === "Newest") return b.date.localeCompare(a.date);
      if (sortBy === "Oldest") return a.date.localeCompare(b.date);
      if (sortBy === "Title A-Z") return a.title.localeCompare(b.title);
      if (sortBy === "Title Z-A") return b.title.localeCompare(a.title);
      return 0;
    });

    return arr;
  };

  return { recentReports, getFilteredReports };
}
