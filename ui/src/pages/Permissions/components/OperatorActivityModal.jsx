import React, { useEffect } from 'react';

function formatWhen(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function OperatorActivityModal({ isOpen, operator, activities, loading, error, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const name = operator ? `${operator.first_name || ''} ${operator.last_name || ''}`.trim() : 'Operator';

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close activity window"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="absolute inset-0 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-[980px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
            <div>
              <div className="text-sm font-extrabold text-white">Operator activity</div>
              <div className="mt-0.5 text-[11px] font-semibold text-white/70">
                {name}{operator?.email ? ` • ${operator.email}` : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-extrabold text-white/85 hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-5">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="text-sm font-semibold text-white/70">Loading activity…</div>
            ) : null}

            {!loading && (!activities || activities.length === 0) ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-sm font-extrabold text-white">No activity found</div>
                <div className="mt-1 text-xs font-semibold text-white/60">
                  This operator has no recorded actions yet.
                </div>
              </div>
            ) : null}

            {!loading && activities && activities.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-12 gap-0 border-b border-white/10 bg-white/5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white/60">
                  <div className="col-span-3">When</div>
                  <div className="col-span-2">Method</div>
                  <div className="col-span-5">Path</div>
                  <div className="col-span-2">Status</div>
                </div>

                {activities.map((a) => (
                  <div
                    key={a.activity_id}
                    className="grid grid-cols-12 gap-0 border-b border-white/5 px-3 py-2 text-[11px] font-semibold text-white/85"
                  >
                    <div className="col-span-3 pr-2 text-white/70">{formatWhen(a.created_at)}</div>
                    <div className="col-span-2 pr-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-extrabold">
                        {a.method}
                      </span>
                    </div>
                    <div className="col-span-5 pr-2 truncate" title={a.path}>
                      {a.path}
                      {a.permission?.name ? (
                        <span className="ml-2 text-[10px] font-extrabold text-white/50">({a.permission.name})</span>
                      ) : null}
                    </div>
                    <div className="col-span-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-extrabold">
                        {a.status_code}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
