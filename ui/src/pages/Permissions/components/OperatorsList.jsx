export function OperatorsList({
  operators,
  selectedOperatorId,
  onSelectOperator,
  isLoading,
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-[#0b1220] p-4">
      <div className="text-white font-semibold mb-3">Operators</div>

      {isLoading && !operators?.length ? (
        <div className="text-sm text-gray-400">Loading operators…</div>
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
                  ? 'border-[#f28c1b]/50 bg-[#243b78]'
                  : 'border-gray-800 bg-[#111b2e] hover:bg-[#162341]'
              }`}
            >
              <div className="text-sm font-semibold text-white truncate">
                {u.first_name} {u.last_name}
              </div>
              <div className="text-xs text-gray-400 truncate">{u.email}</div>
            </button>
          );
        })}
        {!isLoading && operators.length === 0 ? (
          <div className="text-sm text-gray-400">No operators found.</div>
        ) : null}
      </div>
    </div>
  );
}
