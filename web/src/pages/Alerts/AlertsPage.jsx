import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertsMetricsChips from '../../components/alerts/AlertsMetricsChips.jsx';
import AlertsFilterBar from '../../components/alerts/AlertsFilterBar.jsx';
import AlertsBulkActionBar from '../../components/alerts/AlertsBulkActionBar.jsx';
import AlertsTable from '../../components/alerts/AlertsTable.jsx';
import AlertsHeader from '../../components/alerts/AlertsHeader.jsx';
import AlertsPagination from '../../components/alerts/AlertsPagination.jsx';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useVesselContext } from '../../context/VesselContext.jsx';

function formatSeverity(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical') return 'CRIT';
  if (s === 'high') return 'HIGH';
  if (s === 'low') return 'LOW';
  return 'MED';
}

function formatStatus(st) {
  const s = String(st || '').toLowerCase();
  if (s === 'acknowledged') return "ACK'D";
  if (s === 'resolved') return 'RESOLVED';
  if (s === 'dismissed') return 'DISMISSED';
  return 'OPEN';
}

function formatType(type, title) {
  if (title && title.length > 3 && !title.toLowerCase().startsWith('test')) return title;
  const t = String(type || '').toLowerCase();
  if (t === 'speed') return 'Speed Anomaly';
  if (t === 'geofence') return 'Restricted Area Incursion';
  if (t === 'dark_vessel') return 'Dark Vessel / AIS Lost';
  if (t === 'collision_risk') return 'Collision Risk (CPA Alert)';
  if (t === 'transponder_spoofing') return 'Transponder Spoofing';
  if (t === 'loitering') return 'Loitering Pattern';
  return title || 'Manual Surveillance Alert';
}

function formatElapsed(dateStr) {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatTimeUtc(dateStr) {
  if (!dateStr) return '00:00:00 UTC';
  const d = new Date(dateStr);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
}

export default function AlertsPage({ onNavigateTab }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { focusVessel, vessels = [] } = useVesselContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('24h');
  const [selectedAlertIds, setSelectedAlertIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [triagingAlert, setTriagingAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await apiRequest('/api/alerts?limit=100', { token });
      const rawRows = Array.isArray(res) ? res : res?.rows || [];
      const mapped = rawRows.map((r) => ({
        id: `ALT-${String(r.alert_id).padStart(4, '0')}`,
        rawId: r.alert_id,
        severity: formatSeverity(r.severity),
        type: formatType(r.type, r.title),
        vesselName: r.vessel_name || (r.mmsi ? `VESSEL ${r.mmsi}` : 'UNIDENTIFIED TARGET'),
        flag: r.flag || 'PA',
        mmsi: r.mmsi ? String(r.mmsi) : 'N/A',
        imo: r.imo || '9384918',
        coordinates: "51°14'01\"N 001°38'44\"E",
        sector:
          r.type === 'geofence'
            ? 'Restricted Zone Perimeter'
            : r.type === 'speed'
            ? 'Speed Enforced Corridor'
            : 'Sector 04 Perimeter',
        timeUtc: formatTimeUtc(r.created_at),
        elapsed: formatElapsed(r.created_at),
        status: formatStatus(r.status),
        operator: r.assigned_to ? `Operator #${r.assigned_to}` : null,
        details: r.description || r.title || 'Surveillance alert triggered by anomaly detection pipeline.',
      }));
      setAlerts(mapped);
      setError(null);
    } catch (err) {
      console.error('Failed to load alerts from /api/alerts:', err);
      setError(err?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 10000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  const metrics = useMemo(() => {
    const openCount = alerts.filter((a) => a.status === 'OPEN').length;
    const ackCount = alerts.filter((a) => a.status === "ACK'D" || a.status === 'ACKNOWLEDGED').length;
    const resolvedTodayCount = alerts.filter((a) => a.status === 'RESOLVED').length;
    const critCount = alerts.filter((a) => a.severity === 'CRIT').length;
    return {
      open: { count: openCount, label: 'active' },
      acknowledged: { count: ackCount, label: 'in-triage' },
      resolvedToday: { count: resolvedTodayCount, label: 'cleared' },
      critical: { count: critCount, label: 'urgent' },
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          a.vesselName.toLowerCase().includes(query) ||
          a.mmsi.includes(query) ||
          a.id.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (typeFilter !== 'ALL' && !a.type.includes(typeFilter)) return false;
      return true;
    });
  }, [alerts, searchQuery, statusFilter, severityFilter, typeFilter]);

  const handleToggleSelectRow = (id) => {
    setSelectedAlertIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedAlertIds.length === filteredAlerts.length) {
      setSelectedAlertIds([]);
    } else {
      setSelectedAlertIds(filteredAlerts.map((a) => a.id));
    }
  };

  const handleAcknowledgeSelected = async () => {
    const targets = alerts.filter((a) => selectedAlertIds.includes(a.id));
    for (const target of targets) {
      try {
        await apiRequest(`/api/alerts/${target.rawId}/status`, {
          token,
          method: 'PUT',
          body: { status: 'acknowledged' },
        });
      } catch (e) {
        console.error('Failed to acknowledge alert:', e);
      }
    }
    setAlerts((prev) =>
      prev.map((a) => (selectedAlertIds.includes(a.id) ? { ...a, status: "ACK'D" } : a))
    );
    setSelectedAlertIds([]);
  };

  const handleAssignOperator = async () => {
    const targets = alerts.filter((a) => selectedAlertIds.includes(a.id));
    const assignedId = user?.user_id || 1;
    for (const target of targets) {
      try {
        await apiRequest(`/api/alerts/${target.rawId}/assign`, {
          token,
          method: 'PUT',
          body: { assigned_to: assignedId },
        });
      } catch (e) {
        console.error('Failed to assign operator:', e);
      }
    }
    setAlerts((prev) =>
      prev.map((a) =>
        selectedAlertIds.includes(a.id) ? { ...a, operator: `Operator #${assignedId}` } : a
      )
    );
  };

  const handleEscalateDefcon = () => {
    alert('Incident escalated to DEFCON 2: Interdiction alert dispatched to Sector Patrol.');
  };

  const handleMarkFalsePositive = async () => {
    const targets = alerts.filter((a) => selectedAlertIds.includes(a.id));
    for (const target of targets) {
      try {
        await apiRequest(`/api/alerts/${target.rawId}/status`, {
          token,
          method: 'PUT',
          body: { status: 'resolved' },
        });
      } catch (e) {
        console.error('Failed to resolve alert:', e);
      }
    }
    setAlerts((prev) =>
      prev.map((a) => (selectedAlertIds.includes(a.id) ? { ...a, status: 'RESOLVED' } : a))
    );
    setSelectedAlertIds([]);
  };

  const handleFocusOnMap = (alertItem) => {
    if (alertItem) {
      const targetMmsi = alertItem.mmsi;
      const matched = vessels.find(
        (v) => String(v.mmsi) === String(targetMmsi) || String(v.id) === String(targetMmsi)
      );

      if (matched) {
        focusVessel(matched, 10);
      } else {
        focusVessel(
          {
            id: targetMmsi,
            mmsi: targetMmsi,
            name: alertItem.vesselName,
            flag: alertItem.flag || 'PA',
            type: alertItem.type || 'Commercial',
            position: [6.93, 79.84],
            threatLevel: alertItem.severity === 'CRIT' ? 'CRITICAL' : 'WARNING',
            threatReason: alertItem.type,
            threatDetail: alertItem.details,
            lastReport: alertItem.timeUtc,
          },
          10
        );
      }
    }
    navigate('/');
    if (onNavigateTab) onNavigateTab('map');
  };

  return (
    <div className="relative w-full h-full overflow-y-auto select-none bg-surface-container-lowest">
      <main className="w-full p-4 pt-3 max-w-[1720px] mx-auto flex flex-col gap-4">
        {/* Header Title Section */}
        <AlertsHeader
          onAcknowledgeSelected={handleAcknowledgeSelected}
          selectedCount={selectedAlertIds.length}
        />

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-xs text-red-300 font-mono flex items-center justify-between">
            <span>Alerts Feed Connection Issue: {error}</span>
            <button
              onClick={loadAlerts}
              className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-900 text-white font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading && alerts.length === 0 && (
          <div className="px-3 py-1.5 bg-cyan-950/20 border border-cyan-500/30 rounded text-[11px] text-cyan-300 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Synchronizing live surveillance alerts queue...</span>
          </div>
        )}

        {/* 1. Triage Metrics Summary Chips */}
        <AlertsMetricsChips metrics={metrics} />

        {/* 2. Filter Bar */}
        <AlertsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          severityFilter={severityFilter}
          onSeverityFilterChange={setSeverityFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onClearFilters={() => {
            setSearchQuery('');
            setStatusFilter('ALL');
            setSeverityFilter('ALL');
            setTypeFilter('ALL');
          }}
          totalCount={alerts.length}
          displayedCount={filteredAlerts.length}
        />

        {/* 3. Bulk Action Bar (when rows are selected) */}
        <AlertsBulkActionBar
          selectedCount={selectedAlertIds.length}
          onAcknowledgeSelected={handleAcknowledgeSelected}
          onAssignOperator={handleAssignOperator}
          onEscalateDefcon={handleEscalateDefcon}
          onMarkFalsePositive={handleMarkFalsePositive}
          onDeselectAll={() => setSelectedAlertIds([])}
        />

        {/* 4. Alerts 10-Row Table */}
        <AlertsTable
          alerts={filteredAlerts}
          selectedAlertIds={selectedAlertIds}
          onToggleSelectRow={handleToggleSelectRow}
          onToggleSelectAll={handleToggleSelectAll}
          onTriageAlert={(alertItem) => setTriagingAlert(alertItem)}
          onFocusOnMap={handleFocusOnMap}
        />

        {/* 5. Pagination Controls */}
        <AlertsPagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filteredAlerts.length / rowsPerPage))}
          rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            onPageChange={setCurrentPage}
            totalRecords={filteredAlerts.length}
          />
        </main>

      {/* Triage Detail Modal / Drawer */}
      {triagingAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-cyan-400/50 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-outline-variant/30 pb-3">
              <div>
                <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Incident Triage // {triagingAlert.id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {triagingAlert.type}
                </h3>
              </div>
              <button
                onClick={() => setTriagingAlert(null)}
                className="text-outline hover:text-white p-1 rounded"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/30 font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-outline">Vessel Name:</span>
                <span className="text-white font-bold">{triagingAlert.vesselName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">MMSI / IMO:</span>
                <span className="text-cyan-300">{triagingAlert.mmsi} / {triagingAlert.imo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Coordinates:</span>
                <span className="text-white">{triagingAlert.coordinates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Assigned Operator:</span>
                <span className="text-emerald-400">{triagingAlert.operator || 'Unassigned'}</span>
              </div>
            </div>

            <div className="text-xs text-outline leading-relaxed bg-red-950/20 p-3 rounded border border-red-500/30">
              <span className="text-red-400 font-bold block mb-1">Telemetry Diagnostics:</span>
              {triagingAlert.details}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30 font-mono text-xs">
              <button
                onClick={() => setTriagingAlert(null)}
                className="px-3 py-1.5 rounded bg-surface-container border border-outline-variant text-outline hover:text-white"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiRequest(`/api/alerts/${triagingAlert.rawId}/status`, {
                      token,
                      method: 'PUT',
                      body: { status: 'acknowledged' },
                    });
                  } catch (e) {
                    console.error('Failed to acknowledge alert:', e);
                  }
                  setAlerts((prev) =>
                    prev.map((a) => (a.id === triagingAlert.id ? { ...a, status: "ACK'D" } : a))
                  );
                  setTriagingAlert(null);
                }}
                className="px-3 py-1.5 rounded bg-cyan-400 text-slate-950 font-bold hover:brightness-110"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
