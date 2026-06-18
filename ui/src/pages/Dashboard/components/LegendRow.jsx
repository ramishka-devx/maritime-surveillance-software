export function LegendRow({ label, dot }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs font-semibold text-slate-600">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-opacity-20 ${dot.replace('bg-', 'ring-')}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}
