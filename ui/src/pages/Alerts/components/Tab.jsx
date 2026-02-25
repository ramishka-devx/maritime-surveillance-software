export function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-3 py-2 text-[15px] font-extrabold transition",
        active
          ? "bg-accent-orange/15 text-[#ffd7a8]"
          : "text-text-muted hover:text-white hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
