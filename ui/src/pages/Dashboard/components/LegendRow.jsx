export function LegendRow({ label, dot }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px] text-[#c9d3ee]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}
