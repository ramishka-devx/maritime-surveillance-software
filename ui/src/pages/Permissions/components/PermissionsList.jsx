export function PermissionsList({
  selectedOperator,
  operatorPermsByModule,
  isLoading,
  permBusyId,
  error,
  onTogglePermission,
  onViewActivity,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-slate-800 font-semibold">Permissions</div>
          <div className="text-xs font-medium text-slate-500">
            {selectedOperator
              ? `Managing: ${selectedOperator.first_name} ${selectedOperator.last_name}`
              : 'Select an operator to manage permissions.'}
          </div>
        </div>

        {selectedOperator ? (
          <button
            type="button"
            onClick={onViewActivity}
            className="rounded-lg border border-gray-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            View activity
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {selectedOperator && isLoading ? (
        <div className="text-sm font-medium text-slate-400">Loading permissions…</div>
      ) : null}

      {selectedOperator && operatorPermsByModule.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-auto pr-1">
          {operatorPermsByModule.map(({ module, perms }) => (
            <div key={module} className="rounded-lg border border-gray-200 bg-slate-50 p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {module}
              </div>

              <div className="space-y-2">
                {perms.map((p) => {
                  const assigned = Number(p.assigned) === 1;
                  const busy = Number(permBusyId) === Number(p.permission_id);
                  return (
                    <div
                      key={p.permission_id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{p.name}</div>
                        {p.description ? (
                          <div className="text-xs font-medium text-slate-500 truncate">{p.description}</div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        disabled={busy || isLoading}
                        onClick={() => onTogglePermission(p)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                          assigned
                            ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100'
                            : 'text-[#0b74c9] border-[#0b74c9]/20 bg-[#0b74c9]/5 hover:bg-[#0b74c9]/10'
                        }`}
                      >
                        {busy ? 'Working…' : assigned ? 'Revoke' : 'Grant'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
