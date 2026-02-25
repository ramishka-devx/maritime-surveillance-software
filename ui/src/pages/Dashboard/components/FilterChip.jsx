export function Chip({ label, active }) {
  return (
    <button
      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
        active
          ? "bg-[#f28c1b]/15 text-[#ffd7a8] border-[#f28c1b]/30"
          : "bg-white/5 text-[#9aa8c7] border-white/10 hover:bg-white/10 hover:text-white"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}
