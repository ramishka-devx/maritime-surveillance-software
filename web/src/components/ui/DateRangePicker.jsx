import React from 'react';
import { MAX_RANGE_DAYS, RANGE_PRESETS, rangeProblem, todayUtc } from '../../lib/dateRange.js';

const kicker = 'text-[11px] tracking-[0.1em] uppercase text-bs-neutral-700';
const focusRing = 'outline-none focus-visible:outline-bs-accent';
const inputClass = `px-2.5 py-1.5 rounded-sm border border-bs-ink/[.16] bg-white text-[14px] tabular-nums ${focusRing}`;

// UTC day range: preset shortcuts plus From / To inputs. value = { from, to } (YYYY-MM-DD).
export default function DateRangePicker({ value, onChange, disabled = false }) {
  const today = todayUtc();
  const { from, to } = value;
  const problem = rangeProblem(from, to, today);

  return (
    <div className="flex flex-col gap-2.5">
      <div role="group" aria-label="Date range presets" className="flex flex-wrap gap-1.5">
        {RANGE_PRESETS.map((p) => {
          const r = p.range(today);
          const active = r.from === from && r.to === to;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(r)}
              className={`px-2.5 py-1 rounded-sm border text-[12px] ${focusRing} disabled:opacity-50 ${
                active ? 'bg-bs-accent text-bs-bg border-bs-accent' : 'border-bs-ink/[.16] hover:bg-bs-ink/[.07]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={kicker}>From</span>
          <input
            type="date"
            value={from}
            max={to && to < today ? to : today}
            disabled={disabled}
            onChange={(e) => onChange({ from: e.target.value, to })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={kicker}>To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            max={today}
            disabled={disabled}
            onChange={(e) => onChange({ from, to: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <span className={`text-[12px] ${problem ? 'text-bs-accent-2-700' : 'italic text-bs-neutral-700'}`}>
        {problem || `UTC days, both included, up to ${MAX_RANGE_DAYS} days.`}
      </span>
    </div>
  );
}
