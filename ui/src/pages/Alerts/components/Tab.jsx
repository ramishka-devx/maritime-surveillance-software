export function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-3 py-1.5 text-[15px] font-extrabold transition-colors",
        active
          ? "bg-white text-[#0b74c9] shadow-sm"
          : "text-slate-500 hover:text-slate-800 hover:bg-white/60",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
