import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { usePermission } from '../../auth/usePermission.js';
import { apiDownload, saveBlob } from '../../lib/api.js';
import { presetRange, rangeProblem } from '../../lib/dateRange.js';
import DateRangePicker from '../ui/DateRangePicker.jsx';

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const focusRing = 'outline-none focus-visible:outline-bs-accent';

// Filter values match meta-service alerts (alert.validation.js / report.validation.js).
const FILTERS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      ['speed', 'Speed'],
      ['loitering', 'Loitering'],
      ['geofence', 'Restricted area'],
      ['route_deviation', 'Route deviation'],
      ['dark_vessel', 'Dark vessel'],
      ['collision_risk', 'Collision risk'],
      ['manual', 'Manual'],
    ],
  },
  {
    key: 'severity',
    label: 'Severity',
    options: [
      ['critical', 'Critical'],
      ['high', 'High'],
      ['medium', 'Medium'],
      ['low', 'Low'],
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      ['open', 'Unacknowledged'],
      ['acknowledged', 'Acknowledged'],
      ['escalated', 'Escalated'],
      ['resolved', 'Resolved'],
      ['dismissed', 'Dismissed'],
    ],
  },
];

const NO_FILTERS = { type: [], severity: [], status: [] };

// Alert History CSV (GET /api/reports/alert-history.csv) for a date range, optionally only some
// types / severities / statuses. Used on the Reports page and from the Dashboard.
export default function AlertHistoryExport({ initialRange }) {
  const { token, isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const canDownload = can('report.download') || isSuperAdmin();

  const [range, setRange] = useState(() => initialRange || presetRange('7d'));
  const [filters, setFilters] = useState(NO_FILTERS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const problem = rangeProblem(range.from, range.to);
  const filtered = FILTERS.some((f) => filters[f.key].length);

  const toggle = (key, value) => {
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
    setNotice('');
  };

  const download = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const params = new URLSearchParams({ from: range.from, to: range.to });
    for (const f of FILTERS) if (filters[f.key].length) params.set(f.key, filters[f.key].join(','));
    const filename = `alert-history-${range.from}_to_${range.to}${filtered ? '-filtered' : ''}.csv`;
    try {
      const blob = await apiDownload(`/api/reports/alert-history.csv?${params}`, { token });
      saveBlob(blob, filename);
      const rows = (await blob.text()).split('\n').filter((line) => line.trim()).length - 1;
      setNotice(
        rows > 0
          ? `Downloaded ${filename}: ${rows} alert${rows === 1 ? '' : 's'}.`
          : `No alerts ${filtered ? 'match these filters ' : ''}between ${range.from} and ${range.to}, so the file has only the header row.`
      );
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <DateRangePicker
        value={range}
        onChange={(r) => {
          setRange(r);
          setNotice('');
        }}
        disabled={busy}
      />

      <div className="flex flex-col gap-3">
        {FILTERS.map((f) => (
          <div key={f.key} className="flex flex-wrap items-center gap-1.5">
            <span className={`${kicker} w-16 shrink-0`}>{f.label}</span>
            {f.options.map(([value, label]) => {
              const on = filters[f.key].includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  disabled={busy}
                  onClick={() => toggle(f.key, value)}
                  className={`px-2 py-0.5 rounded-sm border text-[12px] ${focusRing} disabled:opacity-50 ${
                    on ? 'bg-bs-ink text-bs-bg border-bs-ink' : 'border-bs-ink/[.16] hover:bg-bs-ink/[.07]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
        <span className="text-[12px] italic text-bs-neutral-700">
          {filtered ? (
            <>
              Only the selected values.{' '}
              <button type="button" onClick={() => setFilters(NO_FILTERS)} className={`underline not-italic ${focusRing}`}>
                Clear filters
              </button>
            </>
          ) : (
            'No filter selected: every alert in the range.'
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={download}
          disabled={busy || !!problem || !canDownload}
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
