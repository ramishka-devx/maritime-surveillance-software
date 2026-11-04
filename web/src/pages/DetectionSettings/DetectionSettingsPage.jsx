import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { btn, btnNeutral, btnPrimary, focusRing, kicker, pageShell, pageTitle, td, th } from '../../components/ui/bs.js';

// Two columns: speed on the left, alerts + loitering on the right.
const COLUMNS = [
  [{ id: 'speed', title: 'Speed anomaly' }],
  [
    { id: 'alerts', title: 'Alerts' },
    { id: 'loitering', title: 'Loitering' },
  ],
];

const num = `h-8 w-24 px-2 text-right tabular-nums text-[13px] bg-bs-surface border rounded-sm hover:border-bs-ink/45 focus-visible:border-bs-accent disabled:opacity-60 ${focusRing} focus-visible:outline-offset-0`;
const groupHead = `${kicker} pb-2 border-b border-bs-ink/[.16]`;
// Threshold rows hold inputs, so use less vertical padding than the shared `td`.
const tdTight = `${td} !py-1.5`;

const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtKn = (v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)} kn`);
const fmtValue = (v) => (v === null || v === undefined ? 'auto' : String(v));

// Form text <-> setting value. Empty means null (only the fallback p99 allows it).
const toText = (v) => (v === null || v === undefined ? '' : String(v));
const toValue = (text) => (text.trim() === '' ? null : Number(text));

function describeChange(entry, labels) {
  const d = entry.details || {};
  if (Array.isArray(d.settings)) {
    if (!d.settings.length) return 'Saved with no changes';
    return d.settings.map((c) => `${labels[c.key] || c.key}: ${fmtValue(c.from)} → ${fmtValue(c.to)}`).join('; ');
  }
  if (d.threshold) {
    const t = d.threshold;
    return `${t.label} override: ${t.from === null ? 'none' : `${t.from} kn`} → ${t.to === null ? 'none' : `${t.to} kn`}`;
  }
  return `${entry.method} ${entry.path}`;
}

// Same shape as the loaded page: two columns of groups (heading, then label/help rows with
// an input on the right), then the threshold table.
function SkeletonRow({ lines = 2 }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-bs-ink/[.08]">
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full max-w-[420px]" />
        {lines > 1 && <Skeleton className="h-3 w-2/3 max-w-[260px]" />}
      </div>
      <Skeleton className="h-8 w-24 shrink-0" />
    </div>
  );
}

function LoadingSkeleton() {
  // Help-text line counts per row, roughly as the real settings wrap.
  const group = (lines) => (
    <section>
      <div className="pb-2 border-b border-bs-ink/[.16]">
        <Skeleton className="h-3 w-28" />
      </div>
      {lines.map((n, i) => (
        <SkeletonRow key={i} lines={n} />
      ))}
    </section>
  );
  return (
    <>
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8 items-start">
        <div className="flex flex-col gap-8">{group([2, 2, 1, 2, 2, 2])}</div>
        <div className="flex flex-col gap-8">
          {group([2])}
          {group([2, 1, 1, 1])}
        </div>
      </div>
      <section className="mt-12">
        <div className="pb-2 border-b border-bs-ink/[.16]">
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-3 w-80 mt-3" />
        <div className="mt-4 pb-2.5 border-b border-bs-ink/[.16]">
          <Skeleton className="h-3 w-24" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-1.5 border-b border-bs-ink/[.08]">
            <Skeleton className="h-4 w-40 flex-1 max-w-[220px]" />
            <Skeleton className="h-8 w-20 ml-auto" />
          </div>
        ))}
      </section>
    </>
  );
}

export default function DetectionSettingsPage() {
  const { token, isSuperAdmin } = useAuth();
  const canEdit = isSuperAdmin();

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({});
  const [overrides, setOverrides] = useState({});
  const [busy, setBusy] = useState(false);

  const showNotice = (text, isError = false) => {
    setNotice({ text, isError });
    setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 5000);
  };

  const reset = (d) => {
    setForm(Object.fromEntries(d.settings.map((s) => [s.key, toText(s.value)])));
    setOverrides(Object.fromEntries(d.thresholds.map((t) => [t.type_group, toText(t.p99_override)])));
  };

  const load = useCallback(async () => {
    try {
      const d = await apiRequest('/api/detection-settings', { token });
      setData(d);
      reset(d);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'Could not load detection settings.');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const labels = useMemo(() => Object.fromEntries((data?.settings || []).map((s) => [s.key, s.label])), [data]);
  const changedSettings = (data?.settings || []).filter((s) => toText(s.value) !== (form[s.key] ?? ''));
  const changedThresholds = (data?.thresholds || []).filter((t) => toText(t.p99_override) !== (overrides[t.type_group] ?? ''));
  const changes = changedSettings.length + changedThresholds.length;
  const computedAt = (data?.thresholds || []).reduce((m, t) => (t.computed_at && (!m || t.computed_at > m) ? t.computed_at : m), null);

  // Settings in one PUT, then each changed override. Stops at the first failure.
  const save = async () => {
    setBusy(true);
    try {
      if (changedSettings.length) {
        await apiRequest('/api/detection-settings', {
          token,
          method: 'PUT',
          body: Object.fromEntries(changedSettings.map((s) => [s.key, toValue(form[s.key])])),
        });
      }
      for (const t of changedThresholds) {
        await apiRequest(`/api/detection-settings/thresholds/${t.type_group}`, {
          token,
          method: 'PUT',
          body: { p99_override: toValue(overrides[t.type_group] ?? '') },
        });
      }
      showNotice(`Saved ${changes} change${changes === 1 ? '' : 's'}. analytic-service picks them up within a minute.`);
    } catch (e) {
      showNotice(e.message || 'Saving failed.', true);
    } finally {
      await load();
      setBusy(false);
    }
  };

  return (
    <div className={pageShell} aria-busy={busy || !data}>
      <div className="flex flex-wrap items-center gap-4 min-h-[42px]">
        <h1 className={pageTitle}>Detection settings</h1>
        {data && !canEdit && <span className="text-[13px] italic text-bs-neutral-700">Read-only</span>}
        {canEdit && changes > 0 && (
          <div className="ml-auto flex items-center gap-2.5">
            <span role="status" className="text-[13px] italic text-bs-accent-2-700">Unsaved changes</span>
            <button type="button" onClick={() => reset(data)} disabled={busy} className={`${btn} ${btnNeutral}`}>
              Discard
            </button>
            <button type="button" onClick={save} disabled={busy} className={`${btn} ${btnPrimary}`}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {!data && loadError && (
        <p role="alert" className="mt-8 text-[14px] italic text-bs-accent-2-700">{loadError}</p>
      )}
      {!data && !loadError && <LoadingSkeleton />}

      {data && (
        <>
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8 items-start">
            {COLUMNS.map((col, i) => (
              <div key={i} className="flex flex-col gap-8 min-w-0">
                {col.map((g) => (
                  <section key={g.id}>
                    <div className={groupHead}>{g.title}</div>
                    {data.settings
                      .filter((s) => s.group === g.id)
                      .map((s) => {
                        const text = form[s.key] ?? '';
                        const dirty = text !== toText(s.value);
                        const offDefault = toText(s.default) !== text;
                        return (
                          <label key={s.key} className="flex items-start gap-4 py-3 border-b border-bs-ink/[.08]">
                            <span className="flex-1 min-w-0">
                              <span className="block text-[14px]">{s.label}</span>
                              <span className="block mt-0.5 text-[12px] text-bs-neutral-700">{s.help}</span>
                            </span>
                            <span className="shrink-0 flex flex-col items-end gap-1">
                              {canEdit ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={text}
                                  placeholder={s.default === null ? 'auto' : undefined}
                                  disabled={busy}
                                  onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
                                  className={`${num} ${dirty ? 'border-bs-accent' : 'border-bs-ink/[.16]'}`}
                                />
                              ) : (
                                <span className="text-[14px] tabular-nums">{fmtValue(s.value)}</span>
                              )}
                              {offDefault && <span className="text-[11px] text-bs-neutral-700">default {fmtValue(s.default)}</span>}
                            </span>
                          </label>
                        );
                      })}
                  </section>
                ))}
              </div>
            ))}
          </div>

          <section className="mt-12">
            <div className={groupHead}>Speed thresholds by vessel type</div>
            <p className="mt-2 text-[12px] text-bs-neutral-700">
              p99 speed per type, {computedAt ? `computed ${fmtTime(computedAt)}` : 'not computed yet'}. An override replaces the computed value.
            </p>
            <table className="mt-2 w-full text-[14px] border-collapse tabular-nums">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.08em] uppercase text-bs-ink/60">
                  <th className={th}>Vessel type</th>
                  <th className={`${th} text-right`}>Samples</th>
                  <th className={`${th} text-right`}>Computed</th>
                  <th className={`${th} text-right`}>Override</th>
                  <th className={`${th} text-right`}>In use</th>
                </tr>
              </thead>
              <tbody>
                {data.thresholds.map((t) => {
                  const text = overrides[t.type_group] ?? '';
                  const dirty = text !== toText(t.p99_override);
                  return (
                    <tr key={t.type_group} className="border-b border-bs-ink/[.08] hover:bg-bs-ink/[.04]">
                      <td className={tdTight}>{t.label}</td>
                      <td className={`${tdTight} text-right text-bs-neutral-700`}>{t.sample_count}</td>
                      <td className={`${tdTight} text-right`}>{fmtKn(t.p99_computed)}</td>
                      <td className={`${tdTight} text-right`}>
                        {canEdit ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="100"
                            value={text}
                            placeholder="none"
                            aria-label={`${t.label} override (kn)`}
                            disabled={busy}
                            onChange={(e) => setOverrides((o) => ({ ...o, [t.type_group]: e.target.value }))}
                            className={`${num} w-20 ${dirty ? 'border-bs-accent' : 'border-bs-ink/[.16]'}`}
                          />
                        ) : (
                          fmtKn(t.p99_override)
                        )}
                      </td>
                      <td className={`${tdTight} text-right font-semibold`}>{fmtKn(t.p99_effective)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="mt-12 max-w-[960px]">
            <div className={groupHead}>Change history</div>
            {data.history.length === 0 && <p className="py-3 m-0 text-[14px] italic text-bs-neutral-700">No changes yet.</p>}
            {data.history.map((h) => (
              <div key={h.activity_id} className="flex flex-wrap gap-x-4 py-3 border-b border-bs-ink/[.08] text-[14px]">
                <span className="w-44 shrink-0 font-mono text-[13px] text-bs-neutral-700">{fmtTime(h.created_at)}</span>
                <span className="w-40 shrink-0">{h.user_name || 'Unknown user'}</span>
                <span className="flex-1 min-w-[240px]">{describeChange(h, labels)}</span>
              </div>
            ))}
          </section>
        </>
      )}

      {notice && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[900] max-w-[80%] px-4 py-2.5 bg-bs-bg shadow-bs-lg text-[13px] flex items-center gap-3">
          <span className={notice.isError ? 'italic text-bs-accent-2-700' : 'italic'}>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className={`text-bs-neutral-700 ${focusRing}`}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
