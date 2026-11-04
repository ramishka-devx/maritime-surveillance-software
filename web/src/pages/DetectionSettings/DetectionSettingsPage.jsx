import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const focusRing = 'outline-none focus-visible:outline-bs-accent';
const inputClass = `w-28 px-2 py-1 rounded-sm border border-bs-ink/[.16] bg-white text-[14px] tabular-nums text-right disabled:bg-transparent disabled:border-transparent ${focusRing}`;
const buttonClass = `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

const GROUPS = [
  { id: 'speed', title: 'Speed anomaly', note: 'Positions above their vessel type’s p99 speed are scored by the IsolationForest model.' },
  { id: 'alerts', title: 'Alerts', note: 'How repeated detections are turned into alerts.' },
  { id: 'loitering', title: 'Loitering', note: 'Rule-based: a vessel staying within a small radius at low speed.' },
];

const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtKn = (v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)} kn`);
const fmtValue = (v) => (v === null || v === undefined ? 'empty' : String(v));

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
    return `${t.label} p99 override: ${t.from === null ? 'none' : `${t.from} kn`} → ${t.to === null ? 'none' : `${t.to} kn`}`;
  }
  return `${entry.method} ${entry.path}`;
}

export default function DetectionSettingsPage() {
  const { token, isSuperAdmin } = useAuth();
  const canEdit = isSuperAdmin();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({});
  const [overrides, setOverrides] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiRequest('/api/detection-settings', { token });
      setData(d);
      setForm(Object.fromEntries(d.settings.map((s) => [s.key, toText(s.value)])));
      setOverrides(Object.fromEntries(d.thresholds.map((t) => [t.type_group, toText(t.p99_override)])));
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load detection settings');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const labels = useMemo(() => Object.fromEntries((data?.settings || []).map((s) => [s.key, s.label])), [data]);
  const changed = useMemo(
    () => (data?.settings || []).filter((s) => toText(s.value) !== (form[s.key] ?? '')),
    [data, form]
  );

  const run = async (fn, okMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await load();
      setNotice(okMessage);
    } catch (e) {
      setError(e.message || 'Saving failed');
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = () =>
    run(
      () =>
        apiRequest('/api/detection-settings', {
          token,
          method: 'PUT',
          body: Object.fromEntries(changed.map((s) => [s.key, toValue(form[s.key])])),
        }),
      `Saved ${changed.length} setting${changed.length === 1 ? '' : 's'}. analytic-service picks changes up within a minute.`
    );

  const saveOverride = (t, value) =>
    run(
      () =>
        apiRequest(`/api/detection-settings/thresholds/${t.type_group}`, {
          token,
          method: 'PUT',
          body: { p99_override: value },
        }),
      value === null ? `Cleared the ${t.label} override.` : `${t.label} threshold set to ${value} kn.`
    );

  if (!data) {
    return (
      <div className="w-full h-full bg-slate-100 text-bs-ink font-sans pt-3 px-4">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">Detection settings</h1>
        <p className={`mt-4 text-[14px] ${error ? 'text-bs-accent-2-700 italic' : 'text-bs-neutral-700'}`}>{error || 'Loading…'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-100 text-bs-ink font-sans pt-3 px-4 pb-16" aria-busy={busy}>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 m-0">Detection settings</h1>
          <p className="mt-1 text-[13px] text-bs-neutral-700">
            {canEdit
              ? 'Changes are audited and reach analytic-service within a minute, without a restart.'
              : 'Read-only. Only a System Administrator can change detection settings.'}
          </p>
        </div>
        {canEdit && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setForm(Object.fromEntries(data.settings.map((s) => [s.key, toText(s.value)])))}
              disabled={busy || !changed.length}
              className={`${buttonClass} border border-bs-ink/[.16] hover:bg-bs-ink/[.07]`}
            >
              <RotateCcw size={15} /> Discard
            </button>
            <button
              onClick={saveSettings}
              disabled={busy || !changed.length}
              className={`${buttonClass} bg-bs-accent text-bs-bg hover:bg-bs-accent-700`}
            >
              <Save size={15} /> {busy ? 'Saving…' : `Save${changed.length ? ` (${changed.length})` : ''}`}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 mb-0 text-[13px] italic text-bs-accent-2-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 mb-0 text-[13px]">
          {notice}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10">
        {GROUPS.map((g) => (
          <section key={g.id}>
            <h2 className={kicker}>{g.title}</h2>
            <p className="mt-1 mb-3 text-[13px] text-bs-neutral-700">{g.note}</p>
            <div className="flex flex-col divide-y divide-bs-ink/[.08]">
              {data.settings
                .filter((s) => s.group === g.id)
                .map((s) => (
                  <label key={s.key} className="flex items-start gap-4 py-2.5">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium">{s.label}</span>
                      <span className="block text-[12px] text-bs-neutral-700">{s.help}</span>
                      <span className="block text-[11px] text-bs-neutral-700 mt-0.5">
                        Default {fmtValue(s.default)}
                        {s.updated_by_name ? ` · changed by ${s.updated_by_name}, ${fmtTime(s.updated_at)}` : ''}
                      </span>
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={form[s.key] ?? ''}
                      placeholder={s.default === null ? 'auto' : undefined}
                      disabled={!canEdit || busy}
                      onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
                      className={inputClass}
                    />
                  </label>
                ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className={kicker}>Speed thresholds by vessel type (p99 SOG)</h2>
        <p className="mt-1 mb-3 text-[13px] text-bs-neutral-700">
          Computed by analytic-service at each model refit. An override replaces the computed value for that vessel type.
          Types with fewer than {data.values['speed.min_group_samples']} samples use the fallback, or their own p99 if higher.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] tabular-nums">
            <thead>
              <tr className={`${kicker} text-left`}>
                <th className="py-2 pr-4 font-normal">Vessel type</th>
                <th className="py-2 pr-4 font-normal text-right">Samples</th>
                <th className="py-2 pr-4 font-normal text-right">Computed</th>
                <th className="py-2 pr-4 font-normal text-right">Override</th>
                <th className="py-2 pr-4 font-normal text-right">In use</th>
                <th className="py-2 font-normal">Computed at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bs-ink/[.08]">
              {data.thresholds.map((t) => {
                const text = overrides[t.type_group] ?? '';
                const dirty = text !== toText(t.p99_override);
                return (
                  <tr key={t.type_group}>
                    <td className="py-2 pr-4">
                      {t.label} <span className="text-bs-neutral-700">({t.type_group})</span>
                    </td>
                    <td className="py-2 pr-4 text-right">{t.sample_count}</td>
                    <td className="py-2 pr-4 text-right">{fmtKn(t.p99_computed)}</td>
                    <td className="py-2 pr-4 text-right">
                      {canEdit ? (
                        <span className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="100"
                            value={text}
                            placeholder="none"
                            disabled={busy}
                            onChange={(e) => setOverrides((o) => ({ ...o, [t.type_group]: e.target.value }))}
                            className={`${inputClass} w-20`}
                          />
                          <button
                            onClick={() => saveOverride(t, toValue(text))}
                            disabled={busy || !dirty}
                            className={`${buttonClass} px-2 py-1 border border-bs-ink/[.16] hover:bg-bs-ink/[.07]`}
                          >
                            Set
                          </button>
                        </span>
                      ) : (
                        fmtKn(t.p99_override)
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right font-semibold">{fmtKn(t.p99_effective)}</td>
                    <td className="py-2 text-bs-neutral-700">{fmtTime(t.computed_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 max-w-[960px]">
        <h2 className={kicker}>Change history</h2>
        {data.history.length === 0 ? (
          <p className="mt-2 text-[13px] text-bs-neutral-700">No changes yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-bs-ink/[.08] list-none p-0">
            {data.history.map((h) => (
              <li key={h.activity_id} className="py-2 text-[13px] flex flex-wrap gap-x-4">
                <span className="text-bs-neutral-700 w-40 shrink-0">{fmtTime(h.created_at)}</span>
                <span className="font-medium w-40 shrink-0">{h.user_name || 'Unknown user'}</span>
                <span className="flex-1 min-w-[240px]">{describeChange(h, labels)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
