import React from 'react';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-1',
    timestamp: '2025-05-18 11:14:02',
    user: 'Cdr. Sarah Vance',
    role: 'CHIEF OPS',
    initials: 'SV',
    avatarColor: 'text-cyan-400',
    parameter: 'Isolation Forest Contamination (ν)',
    oldValue: '0.04',
    newValue: '0.05',
    authCode: 'SEC-OPS-8192',
    reason: 'Storm Dover surge calibration',
  },
  {
    id: 'log-2',
    timestamp: '2025-05-17 19:42:50',
    user: 'Lt. Carlos Martinez',
    role: 'WATCH OFFICER',
    initials: 'CM',
    avatarColor: 'text-blue-300',
    parameter: 'Min Samples Per Peer Group',
    oldValue: '200',
    newValue: '240',
    authCode: 'RULE-TUNE-4011',
    reason: 'Reduce false alert rate in shallow anchorage',
  },
  {
    id: 'log-3',
    timestamp: '2025-05-16 08:05:12',
    user: 'Dr. Aris Thorne',
    role: 'LEAD ML ARCHITECT',
    initials: 'AT',
    avatarColor: 'text-emerald-400',
    parameter: 'Speed Percentile Threshold',
    oldValue: 'p95 (5.0%)',
    newValue: 'p99 (1.0%)',
    authCode: 'ML-REL-3.8.4',
    reason: 'Core model retraining roll-out',
  },
  {
    id: 'log-4',
    timestamp: '2025-05-14 16:20:33',
    user: 'Cdr. Sarah Vance',
    role: 'CHIEF OPS',
    initials: 'SV',
    avatarColor: 'text-cyan-400',
    parameter: 'Acceleration Surge Trigger (Δv/Δt)',
    oldValue: '> 12.0 kn/min',
    newValue: '> 8.5 kn/min',
    authCode: 'EX-NORTH-SHIELD',
    reason: 'Joint NATO interdiction exercise tighten',
  },
];

export default function DetectionAuditLog({ onExport }) {
  return (
    <section className="flex flex-col gap-3 bg-surface-container-low p-4 sm:p-5 rounded-lg border border-outline-variant/30 shadow-sm font-sans select-none">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">manage_history</span>
          <h2 className="text-xs sm:text-sm font-bold text-on-surface tracking-wide uppercase m-0 font-mono">
            Parameter Change History &amp; Audit Trail
          </h2>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="text-[11px] text-outline">SEC-LOG-ID: AUD-99214-OPS</span>
          <button
            type="button"
            onClick={onExport}
            className="px-2.5 py-1 rounded bg-surface-container-highest border border-outline-variant/40 text-on-surface hover:text-cyan-400 hover:border-cyan-400/40 transition-colors flex items-center gap-1.5 text-[11px] uppercase font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {/* Tabular History */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-surface-container text-outline uppercase text-[10px] tracking-wider border-b border-outline-variant/30">
              <th className="py-2.5 px-3">Timestamp (UTC)</th>
              <th className="py-2.5 px-3">Administrator / Operator</th>
              <th className="py-2.5 px-3">Detection Parameter</th>
              <th className="py-2.5 px-3 text-right">Old Value</th>
              <th className="py-2.5 px-3 text-right">New Value</th>
              <th className="py-2.5 px-3">Reason &amp; Authorization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {INITIAL_AUDIT_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-surface-container-high/60 transition-colors">
                <td className="py-2.5 px-3 text-on-surface whitespace-nowrap text-[11px]">
                  {log.timestamp}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-[10px] font-bold">
                      <span className={log.avatarColor}>{log.initials}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold text-[11px]">{log.user}</span>
                      <span className="text-[9px] text-outline uppercase">{log.role}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-on-surface font-medium text-[11px]">
                  {log.parameter}
                </td>
                <td className="py-2.5 px-3 text-right text-red-400 text-[11px] font-semibold">
                  {log.oldValue}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold text-[11px]">
                  {log.newValue}
                </td>
                <td className="py-2.5 px-3 text-outline text-[11px]">
                  <span className="text-cyan-400 font-bold">{log.authCode}:</span> {log.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
