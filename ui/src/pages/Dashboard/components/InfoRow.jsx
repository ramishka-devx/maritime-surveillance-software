export function InfoRow({ k, v }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#7f8db3]">
        {k}
      </div>
      <div className="text-[11px] font-semibold text-white">{v}</div>
    </div>
  );
}
