export function OperatorsList({
  operators,
  selectedOperatorId,
  onSelectOperator,
  isLoading,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-gray-800 font-bold mb-3 text-sm px-1">Operators</div>

      {isLoading && !operators?.length ? (
        <div className="text-sm text-slate-400">Loading operators…</div>
      ) : null}

      <div className="space-y-1.5 overflow-y-auto pr-1">
        {operators.map((u) => {
          const active = String(u.user_id) === String(selectedOperatorId);
          return (
            <button
              key={u.user_id}
              type="button"
              onClick={() => onSelectOperator(String(u.user_id))}
              className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                active
                  ? 'border-[#1b397e]/30 bg-white ring-1 ring-[#1b397e] shadow-sm'
                  : 'border-transparent bg-transparent hover:bg-gray-200/50 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-bold text-gray-800 truncate">
                {u.first_name} {u.last_name}
              </div>
              <div className="text-xs font-semibold text-gray-500 truncate mt-0.5">{u.email}</div>
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
