export function Chip({ label, active }) {
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-all shadow-sm ${
        active
          ? "bg-[#0b74c9]/10 text-[#0b74c9] border-[#0b74c9]/30"
          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}
