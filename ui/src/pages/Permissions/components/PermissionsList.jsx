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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-gray-800 font-extrabold text-lg">Module Permissions</div>
          <div className="text-xs font-semibold text-gray-500 mt-1">
            {selectedOperator
              ? `Managing: ${selectedOperator.first_name} ${selectedOperator.last_name}`
              : 'Select an operator to manage permissions.'}
          </div>
        </div>

        {selectedOperator ? (
          <button
            type="button"
            onClick={onViewActivity}
            className="rounded-lg border border-gray-200 bg-white shadow-sm px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Activity
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
        <div className="space-y-6 pb-8">
          {operatorPermsByModule.map(({ module, perms }) => (
            <div key={module}>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 px-1 border-b border-gray-100 pb-2">
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
                        <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                        {p.description ? (
                          <div className="text-xs font-semibold text-gray-500 truncate mt-0.5">{p.description}</div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        disabled={busy || isLoading}
                        onClick={() => onTogglePermission(p)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors shadow-sm disabled:opacity-60 ${
                          assigned
                            ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100'
                            : 'text-[#1b397e] border-[#1b397e]/20 bg-white hover:bg-gray-50'
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
