import React, { useState } from 'react';

export default function ProfileActivityTab({ onSaveNotice }) {
  const [logs] = useState([
    {
      timestamp: '14:18:04',
      action: 'Interdiction Flagged',
      actionColor: 'text-cyan-400',
      target: 'MMSI 211832000 (CARGO)',
      ip: '192.168.42.108',
      status: 'ACK-OK',
      statusType: 'success',
    },
    {
      timestamp: '13:58:22',
      action: 'Geofence Mod Sector 04',
      actionColor: 'text-purple-300',
      target: 'POLY-S04-RESTRICTED',
      ip: '192.168.42.108',
      status: 'LOGGED',
      statusType: 'success',
    },
    {
      timestamp: '13:45:12',
      action: 'Cryptographic Login',
      actionColor: 'text-emerald-400',
      target: 'FIPS 140-3 TOKEN',
      ip: '192.168.42.108',
      status: 'AUTH-2',
      statusType: 'primary',
    },
    {
      timestamp: '12:30:15',
      action: 'Collision Warning Triage',
      actionColor: 'text-red-400',
      target: 'MMSI 273418290 (KAPITAN V)',
      ip: '192.168.42.108',
      status: 'RESOLVED',
      statusType: 'success',
    },
    {
      timestamp: '11:15:40',
      action: 'AIS Telemetry Sync Check',
      actionColor: 'text-cyan-400',
      target: 'SECTOR-04-TSS',
      ip: '192.168.42.108',
      status: 'VERIFIED',
      statusType: 'primary',
    },
    {
      timestamp: '09:04:12',
      action: 'Shift Handoff Acceptance',
      actionColor: 'text-blue-300',
      target: 'WATCH-LOG-DOVER-04',
      ip: '192.168.42.108',
      status: 'FILED',
      statusType: 'success',
    },
  ]);

  const handleExport = () => {
    if (onSaveNotice) onSaveNotice('Audit activity log exported to encrypted JSON archive.');
  };

  return (
    <div className="bg-surface-container-low rounded-lg p-5 sm:p-6 shadow-md flex flex-col gap-5 border border-outline-variant/30 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">list_alt</span>
          <h2 className="text-sm sm:text-base font-bold text-on-surface uppercase m-0">
            Recent Operator Actions Log
          </h2>
        </div>
        <button
          onClick={handleExport}
          className="font-mono text-xs text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">file_download</span>
          <span>Export All 42 Logs</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-surface-container-lowest text-outline text-[11px] uppercase border-b border-outline-variant/20">
            <tr>
              <th className="py-2 px-3">Timestamp (UTC)</th>
              <th className="py-2 px-3">Action Dispatched</th>
              <th className="py-2 px-3">Target / Reference</th>
              <th className="py-2 px-3">Terminal IP</th>
              <th className="py-2 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {logs.map((log, idx) => (
              <tr
                key={idx}
                className="hover:bg-surface-container transition-colors"
              >
                <td className="py-2.5 px-3 text-on-surface">{log.timestamp}</td>
                <td className={`py-2.5 px-3 font-semibold ${log.actionColor}`}>
                  {log.action}
                </td>
                <td className="py-2.5 px-3 text-on-surface">{log.target}</td>
                <td className="py-2.5 px-3 text-outline">{log.ip}</td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.statusType === 'success'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
