export function Chip({ label, active }) {
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-all shadow-sm ${
        active
          ? "bg-[#0b74c9]/10 text-[#0b74c9] border-[#0b74c9]/30"
          : "bg-gray-50 text-slate-600 border-gray-200 hover:bg-gray-100 hover:text-slate-900"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}
