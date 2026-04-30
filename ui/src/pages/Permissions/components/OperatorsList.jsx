export function OperatorsList({
  operators,
  selectedOperatorId,
  onSelectOperator,
  isLoading,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
      <div className="text-slate-800 font-semibold mb-3">Operators</div>

      {isLoading && !operators?.length ? (
        <div className="text-sm text-slate-400">Loading operators…</div>
      ) : null}

      <div className="space-y-2 max-h-96 overflow-auto pr-1">
        {operators.map((u) => {
          const active = String(u.user_id) === String(selectedOperatorId);
          return (
            <button
              key={u.user_id}
              type="button"
              onClick={() => onSelectOperator(String(u.user_id))}
              className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                active
                  ? 'border-[#0b74c9]/50 bg-white ring-1 ring-[#0b74c9] shadow-sm'
                  : 'border-gray-200 bg-white hover:bg-slate-100 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold text-slate-800 truncate">
                {u.first_name} {u.last_name}
              </div>
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
            </button>
          );
        })}
        {!isLoading && operators.length === 0 ? (
          <div className="text-sm text-slate-400">No operators found.</div>
        ) : null}
      </div>
    </div>
  );
}
