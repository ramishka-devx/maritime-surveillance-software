export function PermissionsList({
  selectedOperator,
  operatorPermsByModule,
  isLoading,
  permBusyId,
  error,
  onTogglePermission,
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-[#0b1220] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white font-semibold">Permissions</div>
          <div className="text-xs text-gray-400">
            {selectedOperator
              ? `Managing: ${selectedOperator.first_name} ${selectedOperator.last_name}`
              : 'Select an operator to manage permissions.'}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {selectedOperator && isLoading ? (
        <div className="text-sm text-gray-400">Loading permissions…</div>
      ) : null}

      {selectedOperator && operatorPermsByModule.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-auto pr-1">
          {operatorPermsByModule.map(({ module, perms }) => (
            <div key={module} className="rounded-lg border border-gray-800 bg-[#111b2e] p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                {module}
              </div>

              <div className="space-y-2">
                {perms.map((p) => {
                  const assigned = Number(p.assigned) === 1;
                  const busy = Number(permBusyId) === Number(p.permission_id);
                  return (
                    <div
                      key={p.permission_id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#0b1220] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                        {p.description ? (
                          <div className="text-xs text-gray-400 truncate">{p.description}</div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        disabled={busy || isLoading}
                        onClick={() => onTogglePermission(p)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                          assigned
                            ? 'text-red-200 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                            : 'text-green-200 border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
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
