import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { usePermission } from '../../auth/usePermission.js';
import { apiDownload, saveBlob } from '../../lib/api.js';
import { shiftDay, todayUtc } from '../../lib/dateRange.js';
import AlertHistoryExport from '../../components/reports/AlertHistoryExport.jsx';

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const focusRing = 'outline-none focus-visible:outline-bs-accent';
const inputClass = `px-2.5 py-1.5 rounded-sm border border-bs-ink/[.16] bg-white text-[14px] tabular-nums ${focusRing}`;

// Match meta-service: ais_positions keeps 2 days (partition-cron.js).
const POSITION_RETENTION_DAYS = 2;

const REPORTS = {
  daily: {
    label: 'Daily activity',
    blurb:
      'One row per vessel seen on the chosen day: number of positions, lowest and highest speed, and the first and last observed position.',
  },
  alerts: {
    label: 'Alert history',
    blurb:
      'One row per alert raised in the chosen range: type, vessel, detection time, severity, confidence score, status, and who acknowledged it and when.',
  },
};

function DailyActivityExport({ canDownload }) {
  const { token } = useAuth();
  const today = todayUtc();
  const oldestPositions = shiftDay(today, -(POSITION_RETENTION_DAYS - 1));
  const [date, setDate] = useState(shiftDay(today, -1));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const filename = `daily-activity-${date}.csv`;
    try {
      const blob = await apiDownload(`/api/reports/daily-activity.csv?date=${date}`, { token });
      saveBlob(blob, filename);
      const rows = (await blob.text()).split('\n').filter((line) => line.trim()).length - 1;
      setNotice(
        rows > 0
          ? `Downloaded ${filename}: ${rows} vessel${rows === 1 ? '' : 's'}.`
          : `No vessel activity was recorded on ${date}, so the file has only the header row.` +
              (date < oldestPositions ? ` Positions are only kept for ${POSITION_RETENTION_DAYS} days.` : '')
      );
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5">
          <span className={kicker}>Date</span>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={`${inputClass} self-start`} />
        </label>
        <span className="text-[12px] italic text-bs-neutral-700">
          UTC day. Vessel positions are kept for {POSITION_RETENTION_DAYS} days (from {oldestPositions}).
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={download}
          disabled={busy || !date || !canDownload}
          title={canDownload ? undefined : 'Requires the report.download permission'}
          className={`inline-flex items-center gap-1.5 px-[18px] py-1.5 rounded-sm bg-bs-accent text-bs-bg text-[13px] font-semibold hover:bg-bs-accent-700 disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
        >
          <Download size={16} />
          {busy ? 'Preparing…' : 'Download CSV'}
        </button>
        {!canDownload && <span className="text-[13px] text-bs-neutral-700">You can view reports but not download them.</span>}
      </div>

      {error && (
        <p role="alert" className="m-0 text-[13px] italic text-bs-accent-2-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="m-0 text-[13px] text-bs-ink">
          {notice}
        </p>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const [type, setType] = useState('daily');

  // Super admins have every permission server-side; hasPermission() deliberately reports
  // false for them in the UI, so let them through explicitly.
  if (!can('reports.view') && !isSuperAdmin()) {
    return (
      <div className="w-full h-full bg-slate-100 text-bs-ink font-sans pt-3 pl-8 pr-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">Reports</h1>
        <p className="mt-4 text-[14px] text-bs-neutral-700">You don't have access to reports. Ask an administrator for the reports.view permission.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-100 text-bs-ink font-sans pt-3 pl-8 pr-6 pb-12">
      <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">Reports</h1>
      <p className="mt-1 text-[13px] text-bs-neutral-700">CSV exports for offline analysis and shift handover. Dates are UTC days.</p>

      <div className="mt-8 max-w-[720px] flex flex-col gap-6">
        <div role="radiogroup" aria-label="Report type" className="inline-flex self-start border border-bs-ink/[.16] rounded-sm overflow-hidden">
          {Object.entries(REPORTS).map(([key, r]) => (
            <button
              key={key}
              role="radio"
              aria-checked={type === key}
              onClick={() => setType(key)}
              className={`px-4 py-1.5 text-[13px] uppercase border-l border-bs-ink/[.16] first:border-l-0 ${focusRing} focus-visible:-outline-offset-2 ${
                type === key ? 'bg-bs-accent text-bs-bg' : 'hover:bg-bs-ink/[.07]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="text-[14px] leading-relaxed m-0">{REPORTS[type].blurb}</p>

        {type === 'daily' ? (
          <DailyActivityExport canDownload={can('report.download') || isSuperAdmin()} />
        ) : (
          <AlertHistoryExport />
        )}
      </div>
    </div>
  );
}
